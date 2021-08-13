import { RipplingSphereAnimation } from "./animations/ripple-animation";
import { PoolRippleAnimation } from "./animations/pool-ripple-animation";

const animations = {
  RipplingSphereAnimation,
  PoolRippleAnimation
}

export const applyAnimation = ({ canvas, animationName, gui, guiAPI }) => {
  const animation = animations[animationName]({ canvas, gui, guiAPI });
  animation.init();
  return animation;
}
