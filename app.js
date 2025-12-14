AFRAME.registerComponent('hiro-controller', {
  init: function () {
    this.model = document.getElementById('model');
    this.marker = document.getElementById('hiro-marker');
    this.state = 'SEARCHING';

    this.marker.addEventListener('markerFound', () => this.onFound());
    this.marker.addEventListener('markerLost', () => this.onLost());
  },

  onFound: function () {
    this.state = 'ATTACHED';
    this.model.setAttribute('visible', true);
  },

  onLost: function () {
    setTimeout(() => {
      if (this.state === 'ATTACHED') {
        this.state = 'STANDBY';
      }
    }, 800);
  },

  tick: function () {
    const obj = this.model.object3D;
    if (this.state === 'ATTACHED') {
      // модель следует за меткой Hiro
      const markerObj = this.marker.object3D;
      const pos = new THREE.Vector3();
      markerObj.getWorldPosition(pos);
      obj.position.lerp(pos, 0.1);
      obj.lookAt(pos);
    } else if (this.state === 'STANDBY') {
      // остаётся рядом, если метка потеряна
      obj.position.lerp(new THREE.Vector3(0.5, 0, -0.5), 0.05);
    } else if (this.state === 'SEARCHING') {
      // начальная позиция — перед камерой
      const cam = this.el.sceneEl.camera;
      if (cam) {
        const camPos = new THREE.Vector3();
        cam.getWorldPosition(camPos);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
        const target = camPos.clone().add(forward.multiplyScalar(1.0));
        obj.position.lerp(target, 0.05);
        obj.lookAt(camPos);
        this.model.setAttribute('visible', true);
      }
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  if (scene) scene.setAttribute('hiro-controller', '');
});
