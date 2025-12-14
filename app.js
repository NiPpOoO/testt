AFRAME.registerComponent('hiro-controller', {
  init: function () {
    this.model = document.getElementById('model');
    this.marker = document.getElementById('hiro-marker');
    this.state = 'SEARCHING';
    this.lastPos = new THREE.Vector3();

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
      const markerObj = this.marker.object3D;
      markerObj.getWorldPosition(this.lastPos);
      const offset = new THREE.Vector3(0.3, 0, 0);
      markerObj.localToWorld(offset);
      const target = this.lastPos.clone().add(offset);
      obj.position.lerp(target, 0.1);
      obj.lookAt(this.lastPos);
    } else if (this.state === 'STANDBY') {
      const standby = this.lastPos.clone().add(new THREE.Vector3(0.5, 0, -0.5));
      obj.position.lerp(standby, 0.05);
    } else if (this.state === 'SEARCHING') {
      const cam = this.el.sceneEl.camera;
      if (cam) {
        const camPos = new THREE.Vector3();
        cam.getWorldPosition(camPos);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
        const target = camPos.clone().add(forward.multiplyScalar(1.0)).add(new THREE.Vector3(0, -0.2, 0));
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
