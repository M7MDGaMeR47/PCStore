/*
Categories: PCs(Full PC), GPU, CPU, RAM, Controller, Laptops, PCs, HDD, SSD
Badge: جديد, مستعمل, تم بيع
*/

const categories = [
    "PC",
    "GPU",
    "CPU",
    "RAM",
    "Controller",
    "Laptops",
    "HDD",
    "SSD"
];

const products = [
    {
        id: 1,
        name: "Gaming PC Ryzen 5",
        category: "PC",
        price: 185000,
        image: "image/pc1.jpg",
        description: "Ryzen 5 | 16GB RAM | 1TB SSD",
        badge: "جديد",
        badgeType: "new"
    },
    {
        id: 2,
        name: "RTX 2070",
        category: "GPU",
        price: 78500,
        image: "image/gpu1.jpg",
        description: "8GB | RGB | GDDR6",
        badge: "مستعمل",
        badgeType: "used"
    },
    {
        id: 3,
        name: "Laptop ASUS",
        category: "Laptops",
        price: 104000,
        image: "image/laptops1.jpg",
        description: "16GB | RTX 3050 | 500gb SSD NVME",
        badge: "جديد",
        badgeType: "new"
    },  
    {
        id: 4,
        name: "Ryzen 5 3600",
        category: "CPU",
        price: 14500,
        image: "image/cpu1.jpg",
        description: "6 Cores | 12 Threads | 32MB L3 Cache",
        badge: "جديد",
        badgeType: "new"
    },  
    {
        id: 5,
        name: "16GB DDR4 HyperX",
        category: "RAM",
        price: 16000,
        image: "image/ram1.jpg",
        description: "DDR4 | 3600MHZ",
        badge: "جديد",
        badgeType: "new"
    },  
    {
        id: 6,
        name: "Controller XBOX",
        category: "Controller",
        price: 7500,
        image: "image/controller1.jpg",
        description: "Xbox Series X",
        badge: "تم بيع",
        badgeType: "sell"
    },  
    {
        id: 7,
        name: "HDD 500GB + Games",
        category: "HDD",
        price: 3500,
        image: "image/hdd1.jpg",
        description: "500GB | 9 Games",
        badge: "مستعمل",
        badgeType: "used"
    },  
    {
        id: 8,
        name: "SSD 1TB",
        category: "SSD",
        price: 13000,
        image: "image/ssd1.jpg",
        description: "SSD | SATA",
        badge: "جديد",
        badgeType: "new"
    },  
]