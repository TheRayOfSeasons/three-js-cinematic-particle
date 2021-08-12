import { RipplingSphereAnimation } from "./animations/ripple-animation";

const animations = {
  RipplingSphereAnimation
}

export const applyAnimation = ({ canvas, animationName, gui, guiAPI }) => {
  const animation = animations[animationName]({ canvas, gui, guiAPI });
  animation.init();
  return animation;
}
