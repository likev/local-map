class ProjectionControl {
    onAdd(map) {
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this.container.style.padding = '10px';
        this.container.style.backgroundColor = 'white';
        this.container.style.fontFamily = 'sans-serif';

        // Title
        const title = document.createElement('div');
        title.innerText = "Projection";
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '8px';
        this.container.appendChild(title);

        // Options
        const projections = [
            { id: 'mercator', label: 'Mercator (Flat)' },
            { id: 'globe', label: 'Globe (3D)' }
        ];

        projections.forEach((proj, index) => {
            const wrapper = document.createElement('div');
            wrapper.style.marginBottom = '5px';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.id = proj.id;
            radio.name = 'map_projection';
            radio.value = proj.id;
            
            // Set default checked state based on current map status
            // (Defaulting to Mercator here for simplicity)
            radio.checked = index === 0;

            radio.addEventListener('change', () => {
                this.map.setProjection({
                    type: proj.id // 'mercator' or 'globe'
                });
            });

            const label = document.createElement('label');
            label.htmlFor = proj.id;
            label.innerText = proj.label;
            label.style.marginLeft = '5px';
            label.style.cursor = 'pointer';

            wrapper.appendChild(radio);
            wrapper.appendChild(label);
            this.container.appendChild(wrapper);
        });

        return this.container;
    }

    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}

export { ProjectionControl };