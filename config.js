const CONFIG = {
    settings: {
        whatsappPhone: "5491153892491",
        slideshowInterval: 2000,
        appName: "Webstore Alpha",
        defaultLabel: "Medidas 2m x 1.50m x 0.40m",
        visibleSectionsCount: 4
    },
    sections: {
        'home-section': {
            title: "Inicio",
            menuTitle: "Inicio",
            menuOrder: 0,
            isHome: true
        },
        'section-1': {
            title: "Muebles de cocina",
            menuTitle: "Muebles de cocina",
            description: "Mesas, Sillas y X",
            menuOrder: 1,
            images: [
                { id: 'Mesa-S1-019', src: 'img/section1/019.jpeg', imageLabel: 'Mesa: 1.20m x 0.90m x 0.85m' },
                { id: 'Mesa-S1-020', src: 'img/section1/020.jpeg', imageLabel: 'Mesa: 2.00m x 1.80m x 0.45m' },
                { id: 'Mesa-S1-026', src: 'img/section1/026.jpeg', imageLabel: 'Mesa: 0.50m x 0.50m x 0.95m' },
                { id: 'Mesa-S1-028', src: 'img/section1/028.jpeg', imageLabel: 'Mesa: 1.40m x 0.70m x 0.75m' },
                { id: 'Mesa-S1-030', src: 'img/section1/030.jpeg', imageLabel: 'Mesa: 1.40m x 0.70m x 0.75m' },
                { id: 'Mesa-S1-031', src: 'img/section1/031.jpeg', imageLabel: 'Mesa: 1.40m x 0.70m x 0.75m' },
                { id: 'Mesa-S1-032', src: 'img/section1/032.jpeg', imageLabel: 'Mesa: 1.40m x 0.70m x 0.75m' }
            ]
        },
        'section-2': {
            title: "Dormitorio",
            menuTitle: "Dormitorio",
            description: "Camas, Mesas de luz y X",
            menuOrder: 2,
            images: [
                { id: 'S2-A1', src: 'img/section2/armchair.jpg', imageLabel: '1.20m x 0.90m x 0.85m' },
                { id: 'S2-B1', src: 'img/section2/bed.jpg', imageLabel: '2.00m x 1.80m x 0.45m' },
                { id: 'S2-C1', src: 'img/section2/chair.jpg', imageLabel: '0.50m x 0.50m x 0.95m' },
                { id: 'S2-D1', src: 'img/section2/desk.jpg', imageLabel: '1.40m x 0.70m x 0.75m' },
                { id: 'S2-I1', src: 'img/section2/interior.jpg', imageLabel: 'Concept Room' },
                { id: 'S2-L1', src: 'img/section2/lamp.jpg', imageLabel: '0.40m x 0.40m x 1.60m' },
                { id: 'S2-S1', src: 'img/placeholders/shelf.jpg', imageLabel: '1.00m x 0.35m x 1.80m' },
                { id: 'S2-SO1', src: 'img/section2/sofa.jpg', imageLabel: '2.10m x 0.95m x 0.85m' },
                { id: 'S2-T1', src: 'img/section2/table.jpg', imageLabel: '1.80m x 0.90m x 0.75m' }
            ]
        },
        'section-3': {
            title: "Section 3",
            menuTitle: "Sección 3",
            description: "Functionality & Style",
            menuOrder: 3,
            images: [
                { id: 'S3-A1', src: 'img/section3/armchair.jpg', imageLabel: '1.20m x 0.90m x 0.85m' },
                { id: 'S3-B1', src: 'img/section3/bed.jpg', imageLabel: '2.00m x 1.80m x 0.45m' },
                { id: 'S3-C1', src: 'img/section3/chair.jpg', imageLabel: '0.50m x 0.50m x 0.95m' },
                { id: 'S3-D1', src: 'img/section3/desk.jpg', imageLabel: '1.40m x 0.70m x 0.75m' },
                { id: 'S3-I1', src: 'img/section3/interior.jpg', imageLabel: 'Concept Room' },
                { id: 'S3-L1', src: 'img/section3/lamp.jpg', imageLabel: '0.40m x 0.40m x 1.60m' },
                { id: 'S3-S1', src: 'img/section3/shelf.jpg', imageLabel: '1.00m x 0.35m x 1.80m' },
                { id: 'S3-SO1', src: 'img/section3/sofa.jpg', imageLabel: '2.10m x 0.95m x 0.85m' },
                { id: 'S3-T1', src: 'img/section3/table.jpg', imageLabel: '1.80m x 0.90m x 0.75m' }
            ]
        },
        'section-4': {
            title: "Section 4",
            menuTitle: "Sección 4",
            description: "Rest & Relaxation",
            menuOrder: 4,
            images: [
                { id: 'S4-A1', src: 'img/section4/armchair.jpg', imageLabel: '1.20m x 0.90m x 0.85m' },
                { id: 'S4-B1', src: 'img/section4/bed.jpg', imageLabel: '2.00m x 1.80m x 0.45m' },
                { id: 'S4-C1', src: 'img/section4/chair.jpg', imageLabel: '0.50m x 0.50m x 0.95m' },
                { id: 'S4-D1', src: 'img/section4/desk.jpg', imageLabel: '1.40m x 0.70m x 0.75m' },
                { id: 'S4-I1', src: 'img/section4/interior.jpg', imageLabel: 'Concept Room' },
                { id: 'S4-L1', src: 'img/section4/lamp.jpg', imageLabel: '0.40m x 0.40m x 1.60m' },
                { id: 'S4-S1', src: 'img/section4/shelf.jpg', imageLabel: '1.00m x 0.35m x 1.80m' },
                { id: 'S4-SO1', src: 'img/section4/sofa.jpg', imageLabel: '2.10m x 0.95m x 0.85m' },
                { id: 'S4-T1', src: 'img/section4/table.jpg', imageLabel: '1.80m x 0.90m x 0.75m' }
            ]
        },
        'about-section': {
            title: "Sobre Nosotros",
            menuTitle: "Sobre Nosotros",
            menuOrder: 5,
            isInfoPage: true
        },
        'contact-section': {
            title: "Contacto",
            menuTitle: "Contacto",
            menuOrder: 6,
            isInfoPage: true
        }
    }
};
