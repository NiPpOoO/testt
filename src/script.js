// src/script.js
import * as THREE from "three";
import arnft from "arnft";
const { ARnft } = arnft;
import ARnftThreejs from "arnft-threejs";
const { SceneRendererTJS, NFTaddTJS } = ARnftThreejs;

const statusEl = document.getElementById("status");
const swapBtn = document.getElementById("swapCamera");

let width = 640;
let height = 480;
let facingMode = "environment";

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

async function initAR() {
  try {
    setStatus("Инициализация…");

    const markerPaths = ["assets/markers/snowman"];
    const markerNames = ["snowman"];

    const nft = await ARnft.init(
      width,
      height,
      [markerPaths],
      [markerNames],
      "./config.json",
      true
    );

    document.addEventListener("containerEvent", function () {
      const canvas = document.getElementById("canvas");
      const fov = (0.8 * 180) / Math.PI;
      const ratio = window.innerWidth / window.innerHeight;

      const config = {
        renderer: {
          alpha: true,
          antialias: true,
          context: null,
          precision: "mediump",
          premultipliedAlpha: true,
          stencil: true,
          depth: true,
          logarithmicDepthBuffer: true
        },
        camera: {
          fov: fov,
          ratio: ratio,
          near: 0.01,
          far: 2000
        }
      };

      const sceneThreejs = new SceneRendererTJS(config, canvas, nft.uuid, true);
      sceneThreejs.initRenderer();

      const renderer = sceneThreejs.getRenderer();
      const scene = sceneThreejs.getScene();

      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.physicallyCorrectLights = true;

      const light = new THREE.DirectionalLight("#fff", 0.9);
      light.position.set(0.5, 0.3, 0.866);
      scene.add(light);

      // Классический куб
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ color: "#00ccff" });
      const cube = new THREE.Mesh(geometry, material);
      cube.scale.set(80, 80, 80);
      cube.visible = false;

      const nftAddTJS = new NFTaddTJS(nft.uuid);
      nftAddTJS.add(cube, "snowman", false);

      const tick = () => {
        sceneThreejs.draw();
        requestAnimationFrame(tick);
      };
      tick();

      setStatus("Готово: наведи камеру на снеговика.");
    });

    document.addEventListener(`getMatrixGL_RH-${nft.uuid}-snowman`, () => {
      setStatus("Снеговик найден ✔");
    });
    document.addEventListener(`nftTrackingLost-${nft.uuid}-snowman`, () => {
      setStatus("Трекинг потерян, наведи камеру снова…");
    });

    swapBtn?.addEventListener("click", async () => {
      facingMode = facingMode === "environment" ? "user" : "environment";
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode, width: { min: 480, max: 640 } }
        });
        const video = document.getElementById("video");
        video.srcObject = stream;
        await new Promise((res) => (video.onloadedmetadata = () => res()));
        setStatus(`Камера: ${facingMode === "environment" ? "тыльная" : "фронтальная"}`);
      } catch (err) {
        console.error(err);
        setStatus("Не удалось переключить камеру");
      }
    });
  } catch (err) {
    console.error(err);
    setStatus("Ошибка инициализации. Проверь пути, HTTPS и консоль.");
  }
}

initAR();
