import { RipplingSphereAnimation } from "./animations/ripple-animation";
import { PoolRippleAnimation } from "./animations/pool-ripple-animation";
import { CollisionTestAnimation } from "./animations/collision-test";
import { InstancedCollisionTestAnimation } from "./animations/instanced-collision-test";

const animations = {
  RipplingSphereAnimation,
  PoolRippleAnimation,
  CollisionTestAnimation,
  InstancedCollisionTestAnimation
}

export const applyAnimation = ({ canvas, animationName, gui, guiAPI }) => {
  const animation = animations[animationName]({ canvas, gui, guiAPI });
  animation.init();
  return animation;
}
