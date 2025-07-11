const vector = {
  _x: 0,
  _y: 0,

  create(x = 0, y = 0) {
    const obj = Object.create(this);
    obj._x = x;
    obj._y = y;
    return obj;
  },

  setX(value) {
    this._x = value;
  },

  getX() {
    return this._x;
  },

  setY(value) {
    this._y = value;
  },

  getY() {
    return this._y;
  },

  setAngleXY(angle) {
    const length = this.getLength();
    this._x = Math.cos(angle) * length;
    this._y = Math.sin(angle) * length;
  },

  getAngleXY() {
    return Math.atan2(this._y, this._x);
  },

  getLength() {
    return Math.sqrt(this._x * this._x + this._y * this._y);
  },

  add(v2) {
    return vector.create(this._x + v2.getX(), this._y + v2.getY());
  },

  multiply(scalar) {
    return vector.create(this._x * scalar, this._y * scalar);
  },

  multiplyBy(scalar) {
    this._x *= scalar;
    this._y *= scalar;
  },

  normalize() {
    const len = this.getLength();
    if (len === 0) return vector.create(0, 0);
    return vector.create(this._x / len, this._y / len);
  },

  clone() {
    return vector.create(this._x, this._y);
  },
};

export default vector;
