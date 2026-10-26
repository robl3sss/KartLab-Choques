import * as T from 'three';

function aim(bone, child, target) {
  bone.updateWorldMatrix(true, true);
  const origin = bone.getWorldPosition(new T.Vector3());
  const from = child.getWorldPosition(new T.Vector3()).sub(origin).normalize();
  const to = target.clone().sub(origin).normalize();
  const world = bone.getWorldQuaternion(new T.Quaternion());
  world.premultiply(new T.Quaternion().setFromUnitVectors(from, to));
  bone.quaternion.copy(bone.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(world));
  bone.updateWorldMatrix(true, true);
}

function bendLimb(root, upperName, lowerName, endName, target, pole) {
  const upper = root.getObjectByName(upperName), lower = root.getObjectByName(lowerName), end = root.getObjectByName(endName);
  if (!upper || !lower || !end) return;
  root.updateMatrixWorld(true);
  const a = upper.getWorldPosition(new T.Vector3()), b = lower.getWorldPosition(new T.Vector3()), c = end.getWorldPosition(new T.Vector3());
  const l1 = a.distanceTo(b), l2 = b.distanceTo(c), delta = target.clone().sub(a);
  const d = T.MathUtils.clamp(delta.length(), Math.abs(l1 - l2) + .01, l1 + l2 - .01);
  const direction = delta.normalize();
  const bend = pole.clone().addScaledVector(direction, -pole.dot(direction)).normalize();
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const elbow = a.clone().addScaledVector(direction, along).addScaledVector(bend, Math.sqrt(Math.max(0, l1 * l1 - along * along)));
  aim(upper, lower, elbow);
  aim(lower, end, a.clone().addScaledVector(direction, d));
}

export function seatPeach(root) {
  const spine = root.getObjectByName('Spine1');
  if (spine) spine.rotation.z += .10;
  root.updateMatrixWorld(true);
  for (const [side, sign] of [['L', 1], ['R', -1]]) {
    bendLimb(root, 'Arm' + side, 'Elbow' + side, 'Hand' + side,
      new T.Vector3(sign * 155, 1110, 290), new T.Vector3(sign, -.2, 0));
    bendLimb(root, 'Leg' + side, 'Knee' + side, 'Foot' + side,
      new T.Vector3(sign * 90, 650, 550), new T.Vector3(0, 1, .2));
  }
  const skirt1 = root.getObjectByName('Skirt1'), skirt2 = root.getObjectByName('Skirt2'), skirt3 = root.getObjectByName('Skirt3');
  if (skirt1 && skirt2 && skirt3) {
    aim(skirt1, skirt2, new T.Vector3(0, 925, 230));
    aim(skirt2, skirt3, new T.Vector3(0, 740, 430));
  }
  root.updateMatrixWorld(true);
  root.traverse(mesh => { if (mesh.isSkinnedMesh) mesh.frustumCulled = false; });
  return root;
}

export function fitPeach(pilot, body, steering) {
  pilot.scale.setScalar(.92);
  pilot.rotation.set(0, Math.PI / 2, 0);
  body.add(pilot);
  body.updateWorldMatrix(true, true);
  const hip = pilot.getObjectByName('Hip');
  if (hip) {
    const anchor = body.worldToLocal(hip.getWorldPosition(new T.Vector3()));
    pilot.position.add(new T.Vector3(-.28, .98, 0).sub(anchor));
  }
  body.updateWorldMatrix(true, true);
  const left = pilot.getObjectByName('HandL'), right = pilot.getObjectByName('HandR');
  if (left && right) {
    const center = left.getWorldPosition(new T.Vector3()).add(right.getWorldPosition(new T.Vector3())).multiplyScalar(.5);
    steering.position.copy(body.worldToLocal(center));
    steering.scale.setScalar(.7);
  }
  const bones = ['Spine1', 'Head', 'ArmL', 'ArmR', 'Hair1', 'Hair2'].map(name => {
    const bone = pilot.getObjectByName(name);
    return bone && {name, bone, rest: bone.quaternion.clone()};
  }).filter(Boolean);
  return {pilot, bones, baseY: pilot.position.y, steering, wheelRest: steering.rotation.x};
}

const offset = new T.Quaternion(), euler = new T.Euler();
export function animatePeach(rig, seconds, active, turn, recoil, reduced) {
  if (!rig) return;
  const breath = reduced ? 0 : Math.sin(seconds * 2.2) * .008;
  const sway = reduced ? 0 : Math.sin(seconds * 4.2) * (active ? .012 : .003);
  rig.pilot.position.y = rig.baseY + (reduced ? 0 : Math.sin(seconds * 2.2) * .003);
  for (const {name, bone, rest} of rig.bones) {
    let x = 0, y = 0, z = 0;
    if (name === 'Spine1') { z = breath + recoil * .12; x = -turn * .035 + sway; }
    else if (name === 'Head') { y = -turn * .10; z = -breath * .6; }
    else if (name.startsWith('Arm')) { x = turn * .045; z = sway * .3; }
    else { y = turn * .035; z = sway * (name === 'Hair1' ? 1.8 : 2.5); }
    bone.quaternion.copy(rest).multiply(offset.setFromEuler(euler.set(x, y, z)));
  }
  rig.steering.rotation.x = rig.wheelRest + turn * .16;
}
