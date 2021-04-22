class svgStringCreator {
    radii;
    constructor() {
        this.getRadii()
    }
    async svgString(paths, svgId) {
        const { outerRad, midOuterRad, midInnerRad, innerRad } = this.radii;
    
        const circles = `
            <circle cx="${0}" cy="${0}" r="${outerRad}" />
            <circle cx="${0}" cy="${0}" r="${midOuterRad}" />
            <circle cx="${0}" cy="${0}" r="${midInnerRad}" />
            <circle cx="${0}" cy="${0}" r="${innerRad}" />
        `
        const lines = `
            <line x1="${-outerRad}" x2="${outerRad}" y1="${0}" y2="${0}" />
            <line x1="${0}" x2="${0}" y1="${-outerRad}" y2="${outerRad}" />
            <line 
                x1="${-outerRad * Math.SQRT1_2}" 
                x2="${outerRad * Math.SQRT1_2}" 
                y1="${-outerRad * Math.SQRT1_2}" 
                y2="${outerRad * Math.SQRT1_2}" 
            />
            <line 
                x1="${outerRad * Math.SQRT1_2}" 
                x2="${-outerRad * Math.SQRT1_2}" 
                y1="${-outerRad * Math.SQRT1_2}" 
                y2="${outerRad * Math.SQRT1_2}" 
            />
        `
    
        return `
            <svg id="${svgId}" viewBox="-1.2 -1.2 2.4 2.4">
                ${paths}
            </svg>
        `
    }

    newRadius(initArea, prevArea = 0) {
        return Math.sqrt(((initArea) + prevArea) / Math.PI)
    }
    circleArea(rad) {
        return Math.PI * Math.pow(rad, 2);
    }
    getRadii() {
        // Equal radii
        let initialArea = 0.5;
        let innerRad = this.newRadius(initialArea);
        let area_r4 = this.circleArea(innerRad);
        let midInnerRad = this.newRadius((initialArea * 1.2), area_r4);
        let area_r3 = this.circleArea(midInnerRad);
        let midOuterRad = this.newRadius((initialArea * 1.4), area_r3);
        let area_midOuterRad = this.circleArea(midOuterRad);
        const outerRad = this.newRadius((initialArea * 1.6), area_midOuterRad);
        const area_outerRad = this.circleArea(outerRad);
        
        this.radii = {
            outerRad,
            midOuterRad,
            midInnerRad,
            innerRad
        }
    }
}

Object.defineProperty(Array.prototype, 'chunk_inefficient', {
    value: function(chunkSize) {
      var array = this;
      return [].concat.apply([],
        array.map(function(elem, i) {
          return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
        })
      );
    }
  });

export class SHA256Avatar extends svgStringCreator {
    sha;
    _sha;
    hashSoul;
    ringSouls;
    paths = [];
    pathsStaggered = [];
    pathsCircle = [];
    pathsStaggeredCircle = [];
    sectionType = {
        SECTION: 'section',
        SECTION_STAGGERED: 'sectionStaggered',
        SECTION_CIRCLE: 'sectionCircle',
        SECTION_STAGGERED_CIRCLE: 'sectionStaggeredCircle',
    }
    pathsType = {
        PATHS: 'paths',
        PATHS_STAGGERED: 'pathsStaggered',
        PATHS_CIRCLE: 'pathsCircle',
        PATHS_STAGGERED_CIRCLE: 'pathsStaggeredCircle',
    }
    mainChart = this.pathsType.PATHS;
    constructor() {
        super();
    }
    get shaText() {
        return this._sha;
    }
    async init(message) {
        this.message = message;
        this.sha = await this.sha256();
        const { hashSoul, ringSouls } = this.computeSouls(this._sha.match(/.{1,2}/g));
        this.hashSoul = hashSoul;
        this.ringSouls = ringSouls;
        this.clearPathLists();
        await this.getPaths();
        await this.getPathsStaggered();
        await this.getPathsCircle();
        await this.getPathsStaggeredCircle();
    }
    clearPathLists() {
            this[this.pathsType.PATHS] = [];
            this[this.pathsType.PATHS_STAGGERED] = [];
            this[this.pathsType.PATHS_CIRCLE] = [];
            this[this.pathsType.PATHS_STAGGERED_CIRCLE] = [];
    }
    async getSvgString(pathType, isMain) {
        const svgId = isMain ? 'svg-main' : `svg-${pathType}`
        return this.svgString(this[pathType], svgId)
    } 
    updateSvgPaths(pathType, isMain) {
        const svgId = isMain ? 'svg-main' : `svg-${pathType}`;
        
        let svg = document.getElementById(svgId);
        let chunks = [].slice.call(svg.children).chunk_inefficient(8);
        chunks.forEach((arr, i) => {
            let circle = pathType.indexOf('Circle') > -1;
            let soul = { hashSoul: this.hashSoul, ringSoul: this.ringSouls[i] };
            let radius = this.radii[Object.keys(this.radii)[i]];
            let sha = this.sha[Object.keys(this.sha)[i]];
            arr.forEach((path, index) => {
                const hex = sha[index];
                const colorSouls = this.mapValueToColorSouls(hex, soul);
                const staggered = pathType.indexOf('Staggered') > -1 && (i % 2) === 1;
                this.updatePath(path, { index, radius }, colorSouls, staggered, circle)
            })
        })
    }
    async getSvgStringStaggered() {
        return this.svgString(this.pathsStaggered)
    } 
    async getSvgStringCircle() {
        return this.svgString(this.pathsCircle)
    } 
    async getSvgStringStaggeredCircle() {
        return this.svgString(this.pathsStaggeredCircle)
    } 
    async getPaths() {
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[0] }, this.sha.outer, this.radii.outerRad, this.sectionType.SECTION, this.pathsType.PATHS);
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[1] }, this.sha.midOuter, this.radii.midOuterRad, this.sectionType.SECTION, this.pathsType.PATHS);
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[2] }, this.sha.midInner, this.radii.midInnerRad, this.sectionType.SECTION, this.pathsType.PATHS);
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[3] }, this.sha.inner, this.radii.innerRad, this.sectionType.SECTION, this.pathsType.PATHS);
    }
    async getPathsStaggered() {
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[0] }, this.sha.outer, this.radii.outerRad, this.sectionType.SECTION, this.pathsType.PATHS_STAGGERED);
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[1] }, this.sha.midOuter, this.radii.midOuterRad, this.sectionType.SECTION_STAGGERED, this.pathsType.PATHS_STAGGERED);
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[2] }, this.sha.midInner, this.radii.midInnerRad, this.sectionType.SECTION, this.pathsType.PATHS_STAGGERED);
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[3] }, this.sha.inner, this.radii.innerRad, this.sectionType.SECTION_STAGGERED, this.pathsType.PATHS_STAGGERED);
    }

    async getPathsStaggeredCircle() {
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[0] }, this.sha.outer, this.radii.outerRad, this.sectionType.SECTION_CIRCLE, this.pathsType.PATHS_STAGGERED_CIRCLE);
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[1] }, this.sha.midOuter, this.radii.midOuterRad, this.sectionType.SECTION_STAGGERED_CIRCLE, this.pathsType.PATHS_STAGGERED_CIRCLE);
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[2] }, this.sha.midInner, this.radii.midInnerRad, this.sectionType.SECTION_CIRCLE, this.pathsType.PATHS_STAGGERED_CIRCLE);
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[3] }, this.sha.inner, this.radii.innerRad, this.sectionType.SECTION_STAGGERED_CIRCLE, this.pathsType.PATHS_STAGGERED_CIRCLE);
    }
    async getPathsCircle() {
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[0] }, this.sha.outer, this.radii.outerRad, this.sectionType.SECTION_CIRCLE, this.pathsType.PATHS_CIRCLE);
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[1] }, this.sha.midOuter, this.radii.midOuterRad, this.sectionType.SECTION_CIRCLE, this.pathsType.PATHS_CIRCLE);
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[2] }, this.sha.midInner, this.radii.midInnerRad, this.sectionType.SECTION_CIRCLE, this.pathsType.PATHS_CIRCLE);
        await this.getRingPaths({ hashSoul: this.hashSoul, ringSoul: this.ringSouls[3] }, this.sha.inner, this.radii.innerRad, this.sectionType.SECTION_CIRCLE, this.pathsType.PATHS_CIRCLE);
    }
    async getRingPaths(soul,arr, radius, sectionType, pathsType) {
        return new Promise((resolve, rej) => {
            const paths = [];
            arr.forEach((hex,i) => {
                const colorSouls = this.mapValueToColorSouls(hex, soul);
                const sec = this[sectionType]({ index: i, radius }, colorSouls);
                this[pathsType].push(sec);
            });
            resolve();
        })
    }
    async sha256() {
        // encode as UTF-8
        const msgBuffer = new TextEncoder().encode(this.message);                    
    
        // hash the message
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    
        // convert ArrayBuffer to Array
        const hashArray = Array.from(new Uint8Array(hashBuffer));
    
        // convert bytes to hex string                  
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
        this._sha = hashHex;

        const splitSha = hashHex.match(/.{1,16}/g);
        const outer = splitSha[0].match(/.{1,2}/g)
        const midOuter = splitSha[1].match(/.{1,2}/g)
        const midInner = splitSha[2].match(/.{1,2}/g)
        const inner = splitSha[3].match(/.{1,2}/g)
        return {
            outer,
            midOuter,
            midInner,
            inner
        };
    }
    hex2bin(hex){
        return (parseInt(hex, 16).toString(2)).padStart(8, '0');
    }
    computeSouls(bytes) {
        const ringLength = Math.round(bytes.length / 4)
        const rings = [
            bytes.slice(0, ringLength),
            bytes.slice(1 * ringLength, 2 * ringLength),
            bytes.slice(2 * ringLength, 3 * ringLength),
            bytes.slice(3 * ringLength, 4 * ringLength)
        ];
        const xorReducer = (xor, byte) => xor ^ parseInt(byte, 16)
        return {
            hashSoul: (bytes.reduce(xorReducer, 0) / 0xff) * 2 - 1,
            ringSouls: rings.map(ring => (ring.reduce(xorReducer, 0) / 0xff) * 2 - 1)
        }
    }

    mapValueToColor(value,) {
        const byte = parseInt(value, 16);
        const colorH = byte >> 4
        const colorS = (byte >> 2) & 0x03
        const colorL = byte & 0x03
        const normalizedH = colorH / 16
        const normalizedS = colorS / 4
        const normalizedL = colorL / 4
        const h = 360 * normalizedH;
        const s = 50 + 50 * normalizedS // Saturation between 50 and 100%
        const l = 40 + 30 * normalizedL // Lightness between 40 and 70%
        const hsl = `hsl(${h}, ${s}%, ${l}%)`;
        return hsl;
    }
    mapValueToColorSouls(value, { hashSoul, ringSoul }) {
        const byte = parseInt(value, 16);
        const colorH = byte >> 4
        const colorS = (byte >> 2) & 0x03
        const colorL = byte & 0x03
        const normalizedH = colorH / 16
        const normalizedS = colorS / 4
        const normalizedL = colorL / 4
        const h = 360 * hashSoul
            + 120 * ringSoul
            +  30 * normalizedH;
        const s = 50 + 50 * normalizedS // Saturation between 50 and 100%
        const l = 40 + 30 * normalizedL // Lightness between 40 and 70%
        const hsl = `hsl(${h}, ${s}%, ${l}%)`;
        return hsl;
    }
    getDistance(point1, point2) {
        const xDist = point2.x - point1.x;
        const yDist = point2.y - point1.y;
        const dist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
        return dist;
    }
    polarPoint(radius, angle) {
        return {
            x: radius * Math.cos(2 * Math.PI * angle - Math.PI / 2),
            y: radius * Math.sin(2 * Math.PI * angle - Math.PI / 2),
        }
    }
    moveTo({ x, y }) {
        return `M ${x} ${y}`;
    }
    lineTo({ x, y }) {
        return `L ${x} ${y}`;
    }
    arcTo({ x, y }, radius) {
        return `A ${radius} ${radius} 0 0 0 ${x} ${y}`;
    }
    arcToHalfCircle(point1, point2) {
        const radius = this.getDistance(point1, point2) / 2;
        return `A ${radius} ${radius} 0 1 0 ${point1.x} ${point1.y}`;
    }
    getD(point1, point2, radius = null) {
        const arc = radius !== null ? this.arcTo(point1, radius) : this.arcToHalfCircle(point1, point2)
        const d = [
            this.moveTo({ x: 0, y: 0}),
            this.lineTo(point2),
            arc,
            'Z'
        ].join(' ');
        return d;
    }
    updatePath(path, { index, radius }, color, staggered = false, circle = false) {
        let angleA = index / 8;
        let angleB = (index + 1) / 8;
        if (staggered) {
            const lookup = [1,3,5,7,9,11,13,15,1]
            angleA = (lookup[index] / 16);
            angleB = (lookup[index + 1]) / 16;
        }
        const point1 = this.polarPoint(radius, angleA);
        const point2 = this.polarPoint(radius, angleB);
        const d = circle ? this.getD(point1,point2) : this.getD(point1,point2,radius);
        path.setAttribute('d', d)
        path.setAttribute('fill', color);
    }
    section({ index, radius }, color) {
        const angleA = index / 8;
        const angleB = (index + 1) / 8;
        const point1 = this.polarPoint(radius, angleA);
        const point2 = this.polarPoint(radius, angleB);
        const d = this.getD(point1,point2,radius);
        return `<path d="${d}" fill="${color}" />`
    }
    sectionStaggered({ index, radius }, color) {
        const lookup = [1,3,5,7,9,11,13,15,1]
        const angleA = (lookup[index] / 16);
        const angleB = (lookup[index + 1]) / 16;
        const point1 = this.polarPoint(radius, angleA);
        const point2 = this.polarPoint(radius, angleB);
        const d = this.getD(point1,point2,radius);
        return `<path d="${d}" fill="${color}" />`
    }
    sectionCircle({ index, radius }, color) {
        const angleA = index / 8;
        const angleB = (index + 1) / 8;
        const point1 = this.polarPoint(radius, angleA);
        const point2 = this.polarPoint(radius, angleB);
        const d = this.getD(point1,point2);
        return `<path d="${d}" fill="${color}" />`
    }
    sectionStaggeredCircle({ index, radius }, color) {
        const lookup = [1,3,5,7,9,11,13,15,1]
        const angleA = (lookup[index] / 16);
        const angleB = (lookup[index + 1]) / 16;
        const point1 = this.polarPoint(radius, angleA);
        const point2 = this.polarPoint(radius, angleB);
        const d = this.getD(point1,point2);
        return `<path d="${d}" fill="${color}" />`
    }
}

