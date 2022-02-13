function maxFriction(friction: number, velocityX: number, velocityY: number, maxFrictionTime: number, result: [number, number] | [null, null]) {
  var velocity = Math.sqrt(Math.pow(velocityX,2) + Math.pow(velocityY,2));
  friction = Math.max(friction, velocity/maxFrictionTime);
  changeVectorNorm(velocityX, velocityY, friction, result);
  result[0] = Math.abs(Number(result[0]));
  result[1] = Math.abs(Number(result[1]));
}

function changeVectorNorm(x: number, y: number, n: number, result: null[] | number[]) {
  var theta = Math.atan(y/x);
  result[0] = n * Math.cos(theta);
  result[1] = n * Math.sin(theta);
}

// TODO: restructure these imports
export {
  maxFriction,
  changeVectorNorm
};
