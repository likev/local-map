import { createDeckGLSombreroContourLayer, createDeckGLMonkeySaddleContourLayer, createDeckGLCassiniContourLayer } from './deckglLayer.js';

class MathLayerControl {
    constructor(deckOverlay) {
        this.deckOverlay = deckOverlay;
        this.container = null;
    }

    onAdd(map) {
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this.container.style.padding = '10px';
        this.container.style.backgroundColor = 'white';
        this.container.style.fontFamily = 'sans-serif';

        // Title
        const title = document.createElement('div');
        title.innerText = "Select Function";
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '8px';
        this.container.appendChild(title);

        // Radio Buttons
        const options = [
            { id: 'sombrero', label: 'Sombrero' },
            { id: 'cassini', label: 'Cassini Ovals' },
            { id: 'monkey', label: 'Monkey Saddle' }
        ];

        options.forEach((opt, index) => {
            const wrapper = document.createElement('div');
            wrapper.style.marginBottom = '5px';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.id = opt.id;
            radio.name = 'math_layer';
            radio.value = opt.id;
            radio.checked = index === 0; // Select first by default
            
            // Event Listener: Switch Layer on Click
            radio.addEventListener('change', () => this.updateLayer(opt.id));

            const label = document.createElement('label');
            label.htmlFor = opt.id;
            label.innerText = opt.label;
            label.style.marginLeft = '5px';
            label.style.cursor = 'pointer';

            wrapper.appendChild(radio);
            wrapper.appendChild(label);
            this.container.appendChild(wrapper);
        });

        // Initialize with the first one
        this.updateLayer('sombrero');

        return this.container;
    }

    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.container = null;
    }

    updateLayer(type) {
        // UPDATE DECK OVERLAY
        let newLayer = null;

        // Configuration mapping
        if (type === 'sombrero') {
            newLayer = createDeckGLSombreroContourLayer();
        } else if (type === 'cassini') {
            newLayer = createDeckGLCassiniContourLayer();
        } else if (type === 'monkey') {
            newLayer = createDeckGLMonkeySaddleContourLayer();
        }

        this.deckOverlay.setProps({
            layers: [newLayer]
        });
    }
}

export { MathLayerControl };