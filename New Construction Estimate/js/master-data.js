/* © 2026 Nozomi Sakurada. All rights reserved. */

// ===== マスターデータ：機器一覧 =====
const MASTER_EQUIPMENT = {
  equipment: [
    {
      id: 'GH-H2400ZW',
      name: 'GH-H2400ZW',
      category: '給湯器',
      unitPrice: 139000,
      qty: 1
    },
    {
      id: 'TC-713E',
      name: 'TC-713E',
      category: '給湯器',
      unitPrice: 20000,
      qty: 1
    },
    {
      id: 'HC-6534',
      name: 'HC-6534（配管カバーH650）',
      category: '給湯器',
      unitPrice: 4800,
      qty: 1
    }
  ],

  joints: [
    {
      id: 'CH-J20A0F',
      name: 'CH-J20A0F（クリップ付）',
      category: '給湯器',
      type: 'QFジョイント(3/4用)',
      unitPrice: 1100,
      qty: 2
    },
    {
      id: 'CH-J15A0F',
      name: 'CH-J15A0F（クリップ付）',
      category: '給湯器',
      type: 'QFジョイント1/2用',
      unitPrice: 1705,
      qty: 1
    },
    {
      id: 'WJ1A-2016C-S',
      name: 'WJ1A-2016C-S',
      category: '給湯器',
      type: 'ダブルロックジョイント',
      unitPrice: 1900,
      qty: 2
    },
    {
      id: 'WJ18A2016C-S',
      name: 'WJ18A2016C-S',
      category: '給湯器',
      type: 'ダブルロックジョイント',
      unitPrice: 2300,
      qty: 2
    },
    {
      id: 'TP-LH4',
      name: 'TP-LH4',
      category: '給湯器',
      type: 'Lヘッダー(5P)',
      unitPrice: 5100,
      qty: 2
    }
  ],

  materials: [
    {
      id: 'DREN-HOGO',
      name: 'ドレン配管保温部材',
      category: '給湯器',
      unitPrice: 3000,
      qty: 1
    },
    {
      id: 'FUZUI-HOZON',
      name: '不凍液　他部材',
      category: '給湯器',
      unitPrice: 10000,
      qty: 1
    },
    {
      id: 'KIKI-HEADER',
      name: '機器設置・ヘッダー組立',
      category: '給湯器',
      unitPrice: 25000,
      qty: 1
    }
  ],

  heaters: [
    {
      id: 'CRH-600ES',
      name: 'CRH-600ES',
      category: 'ルームヒーター',
      type: '温水ルームヒーター',
      unitPrice: 42000,
      qty: 1
    },
    {
      id: 'CRH-400ES',
      name: 'CRH-400ES',
      category: 'ルームヒーター',
      type: '温水ルームヒーター',
      unitPrice: 38000,
      qty: 1
    }
  ],

  heaterParts: [
    {
      id: 'ONSUI-CONSENT',
      name: '温水コンセント　他部材',
      category: 'ルームヒーター',
      unitPrice: 10000,
      qty: 4
    },
    {
      id: 'DANBOATSU-KOUKAN',
      name: '暖房配管施工費',
      category: 'ルームヒーター',
      unitPrice: 27000,
      qty: 4
    },
    {
      id: 'ZATUGYO',
      name: '雑工事',
      category: 'ルームヒーター',
      unitPrice: 20000,
      qty: 1
    }
  ]
};

// ===== カテゴリ定義 =====
const CATEGORIES = [
  { id: 'equipment', name: '給湯器関係', section: 'equipmentSection' },
  { id: 'heater', name: 'ルームヒーター関係', section: 'heaterSection' },
  { id: 'works', name: '工事・材料', section: 'worksSection' }
];
