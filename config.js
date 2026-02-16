const CONFIG = {
    settings: {
        whatsappPhone: "5491153892491",
        slideshowInterval: 1000,
        slideshowMode: "sequence", // "sync" or "sequence"
        appName: "Santael",
        defaultLabel: "Medidas 2m x 1.50m x 0.40m",
        visibleSectionsCount: 2
    },
    sections: {
        'home-section': {
            title: "Inicio",
            menuTitle: "Inicio",
            menuOrder: 0,
            isHome: true
        },
        'section-1': {
            title: "Cocina",
            menuTitle: "Muebles de cocina",
            description: "Mesas, Sillas",
            menuOrder: 2,
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
            description: "Camas, Mesas de luz.",
            menuOrder: 1,
            images: [
                { id: 'Cama-S2-037', src: 'img/section2/037.jpeg', imageLabel: '1.20m x 0.90m x 0.85m' },
                { id: 'Cama-S2-038', src: 'img/section2/038.jpeg', imageLabel: '2.00m x 1.80m x 0.45m' },
                { id: 'Cama-S2-039', src: 'img/section2/039.jpeg', imageLabel: '0.50m x 0.50m x 0.95m' },
                { id: 'Cama-S2-040', src: 'img/section2/040.jpeg', imageLabel: '1.40m x 0.70m x 0.75m' },
                { id: 'Cama-S2-041', src: 'img/section2/041.jpeg', imageLabel: 'Concept Room' },
                { id: 'Cama-S2-042', src: 'img/section2/042.jpeg', imageLabel: '0.40m x 0.40m x 1.60m' },
                { id: 'Cama-S2-043', src: 'img/section2/043.jpeg', imageLabel: '1.00m x 0.35m x 1.80m' },
                { id: 'Cama-S2-044', src: 'img/section2/044.jpeg', imageLabel: '2.10m x 0.95m x 0.85m' },
                { id: 'Cama-S2-045', src: 'img/section2/045.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-046', src: 'img/section2/046.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-047', src: 'img/section2/047.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-048', src: 'img/section2/048.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-049', src: 'img/section2/049.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-050', src: 'img/section2/050.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-051', src: 'img/section2/051.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-052', src: 'img/section2/052.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-053', src: 'img/section2/053.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-054', src: 'img/section2/054.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-055', src: 'img/section2/055.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-056', src: 'img/section2/056.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-057', src: 'img/section2/057.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-058', src: 'img/section2/058.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-059', src: 'img/section2/059.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-060', src: 'img/section2/060.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' },
                { id: 'Cama-S2-061', src: 'img/section2/061.jpeg', imageLabel: '1.80m x 0.90m x 0.75m' }
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
