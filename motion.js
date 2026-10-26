import * as T from 'three';

// Resample at equal distances before filtering. This removes digitization jitter
// without cutting the large corners or changing the timing of the 1D experiment.
export function makeSmoothRoute(points) {
  const source = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)), false, 'centripetal');
  source.arcLengthDivisions = 8000;
  const count = Math.max(80, Math.ceil(source.getLength() / 1.2));
  let samples = source.getSpacedPoints(count);
  for (let pass = 0; pass < 3; pass++) {
    samples = samples.map((p, i, all) => {
      if (i < 2 || i > all.length - 3) return p.clone();
      return all[i - 2].clone().addScaledVector(all[i - 1], 4)
        .addScaledVector(p, 6).addScaledVector(all[i + 1], 4).add(all[i + 2]).multiplyScalar(1 / 16);
    });
  }
  const curve = new T.CatmullRomCurve3(samples, false, 'centripetal');
  curve.arcLengthDivisions = Math.max(4000, count * 4);
  curve.updateArcLengths();
  return curve;
}

// Cosine acceleration/deceleration keeps the tour's speed continuous at both ends.
export function tourProgress(seconds, duration) {
  const t = T.MathUtils.clamp(seconds, 0, duration), ramp = 1.8;
  const cruise = 1 / (duration - ramp);
  if (t < ramp) return cruise * (t / 2 - ramp * Math.sin(Math.PI * t / ramp) / (2 * Math.PI));
  if (t > duration - ramp) {
    const remaining = duration - t;
    return 1 - cruise * (remaining / 2 - ramp * Math.sin(Math.PI * remaining / ramp) / (2 * Math.PI));
  }
  return cruise * (t - ramp / 2);
}

export function routePose(curve, progress, lane) {
  const t = T.MathUtils.clamp(progress, 0, 1), length = curve.getLength();
  const ahead = Math.min(.015, 3.2 / length);
  const position = curve.getPointAt(t);
  const forward = curve.getPointAt(Math.min(1, t + ahead))
    .sub(curve.getPointAt(Math.max(0, t - ahead))).normalize();
  const right = new T.Vector3().crossVectors(forward, new T.Vector3(0, 1, 0)).normalize();
  const up = new T.Vector3().crossVectors(right, forward).normalize();
  position.addScaledVector(right, lane).addScaledVector(up, .07);
  const quaternion = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(forward, up, right));
  return {position, quaternion};
}
