import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function createPins(scene) {
  const loader = new THREE.TextureLoader();

  function createPin(position, svgURL, name, status, price) {
  const pinGroup = new THREE.Group();
  pinGroup.userData = { name, status, price };

  loader.load(svgURL, texture => {
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, alphaTest: 0.1 });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.1, 0.1, 1);
    sprite.center.set(0.5, 0); // Ujung bawah pin menyentuh lantai
    sprite.position.set(0, 0, 0);
    pinGroup.add(sprite);

    pinGroup.position.copy(position); // Set posisi SETELAH sprite ditambahkan
    scene.add(pinGroup);
  });

  return pinGroup;
}

const pin1 = createPin(
  new THREE.Vector3(0.28, 0, -0.41),
  'public/assets/pin1.svg',
  'Unit A',
  'Sold',
  '1,325,000 $'
);

const pin2 = createPin(
  new THREE.Vector3(-0.35, 0, 0),
  'public/assets/pin2.svg',
  'Unit B',
  'Available',
  '985,000 $'
);

const pin3 = createPin(
  new THREE.Vector3(-1, 0, 0.59),
  'public/assets/pin3.svg',
  'Unit B',
  'Available',
  '985,000 $'
);

const pin4 = createPin(
  new THREE.Vector3(-0.38, 0, 0.96),
  'public/assets/pin4.svg',
  'Unit B',
  'Available',
  '985,000 $'
);

const pin5 = createPin(
  new THREE.Vector3(-0.70, 0, 0.90),
  'public/assets/pin5.svg',
  'Unit B',
  'Available',
  '985,000 $'
);

// const pin6 = createPin(
//   new THREE.Vector3(0.5, 0, -0.6),
//   'assets/pin6.svg',
//   'Unit B',
//   'Available',
//   '985,000 $'
// );

  const pins = [pin1, pin2, pin3, pin4, pin5];

  const pinPOIs = [
    {
        id: 'pin1',
        mesh: pin1,
        position: pin1.position,
        descriptionId: 'pooldescription', // sesuai ID HTML
        camera_position: new THREE.Vector3(0.65, 0.73 , -0.80),
        camera_target: pin1.position,
    },
    {
      id: 'pin2',
      mesh: pin2,
      position: pin2.position,
      descriptionId: 'housedescription',
      camera_position: new THREE.Vector3(0.18, 0.68, -0.27),
      camera_target: pin2.position,
    },
    {
      id: 'pin3',
      mesh: pin3,
      position: pin3.position,
      descriptionId: 'gardendescription',
      camera_position: new THREE.Vector3(-1.56, 0.77, 0.42),
      camera_target: pin3.position,
    },
    {
      id: 'pin4',
      mesh: pin4,
      position: pin4.position,
      descriptionId: 'arrivaldescription',
      camera_position: new THREE.Vector3(-0.83, 0.81, 0.87),
      camera_target: pin4.position,
    },
    {
      id: 'pin5',
      mesh: pin5,
      position: pin5.position,
      descriptionId: 'archdescription',
      camera_position: new THREE.Vector3(-0.84, 0.79, 1.31),
      camera_target: pin5.position,
    },
    // {
    //   id: 'pin6',
    //   mesh: pin6,
    //   position: pin6.position,
    //   descriptionId: 'backdescription',
    //   camera_position: new THREE.Vector3(0.52, 0.63, -1.03),
    //   camera_target: pin6.position,
    // },
  ];

  return { pins, pinPOIs };
}
