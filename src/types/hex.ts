import { ApiMap } from "@/api/type";
import { GameDisplay } from "@/utils";

export class HexGrid {
    hexCols: Array<hexCol>
    radius: number
    hexArray: Array<{
        x: number;
        y: number;
        radius: number;
        mode: 'origin' | 'fight-fortress' | 'gold-center' | 'black-swamp' | 'chance-place' | 'secret-place' | 'normal'
        fill?: string
        text?: string
    }>

    constructor(originX: number, originY: number, radius?: number) {
        this.radius = radius ?? 20
        this.hexCols = []
        this.hexArray = []
        this.render(originX, originY, this.radius)
    }

    render(originX: number, originY: number, radius: number, tileSets?: ApiMap['/game/occupyStatus/:gameId']['resp'], round?: number) {
        this.radius = radius
        const width = this.radius * 1.5;
        const height = this.radius * Math.sqrt(3) / 2;
        this.hexCols = [
            { x: originX + width, y: originY + height * 15, rows: 2 },
            { x: originX + width, y: originY + height * 27, rows: 1 },
            { x: originX + width * 2, y: originY + height * 12, rows: 3 },
            { x: originX + width * 2, y: originY + height * 22, rows: 1 },
            { x: originX + width * 2, y: originY + height * 26, rows: 2 },
            { x: originX + width * 3, y: originY + height * 9, rows: 12 },
            { x: originX + width * 4, y: originY + height * 8, rows: 13 },
            { x: originX + width * 5, y: originY + height * 7, rows: 13 },
            { x: originX + width * 6, y: originY + height * 6, rows: 15 },
            { x: originX + width * 7, y: originY + height * 3, rows: 16 },
            { x: originX + width * 8, y: originY + height * 4, rows: 15 },
            { x: originX + width * 9, y: originY + height, rows: 18 },
            { x: originX + width * 10, y: originY, rows: 19 },
            { x: originX + width * 11, y: originY + height, rows: 18 },
            { x: originX + width * 12, y: originY + height * 2, rows: 18 },
            { x: originX + width * 13, y: originY + height, rows: 18 },
            { x: originX + width * 14, y: originY + height * 2, rows: 17 },
            { x: originX + width * 15, y: originY + height * 7, rows: 15 },
            { x: originX + width * 16, y: originY + height * 8, rows: 12 },
            { x: originX + width * 16, y: originY + height * 34, rows: 1 },
            { x: originX + width * 17, y: originY + height * 7, rows: 13 },
            { x: originX + width * 18, y: originY + height * 6, rows: 13 },
            { x: originX + width * 19, y: originY + height * 7, rows: 5 },
            { x: originX + width * 19, y: originY + height * 19, rows: 7 },
            { x: originX + width * 20, y: originY + height * 10, rows: 3 },
            { x: originX + width * 20, y: originY + height * 18, rows: 7 },
            { x: originX + width * 21, y: originY + height * 9, rows: 3 },
            { x: originX + width * 21, y: originY + height * 19, rows: 2 },
            { x: originX + width * 21, y: originY + height * 25, rows: 2 },
            { x: originX + width * 22, y: originY + height * 20, rows: 1 },
        ]
        this.hexArray = [];
        for (let i = 0; i < this.hexCols.length; i++) {
            for (let j = 0; j < this.hexCols[i].rows; j++) {
                this.hexArray.push({ x: this.hexCols[i].x, y: this.hexCols[i].y + j * this.radius * Math.sqrt(3), radius: this.radius, mode: 'normal' });
            }
        }
        this.setMode([0, 6, 19, 21, 61, 62, 111, 165, 185, 228, 242, 266, 277, 279, 280, 282], 'origin')
        if (tileSets) {
            this.setTotalMode(
                tileSets.blackSwampTiles,
                tileSets.fortressTiles,
                tileSets.opportunityTiles,
                tileSets.blindBoxTiles,
                tileSets.goldCenterTiles)
            if (round && round >= 3) {
                this.setMode(tileSets.opportunityTiles, 'chance-place')
            }
            for (const team of tileSets.teams) {
                team.occupiedTiles.forEach(tileSet => {
                    if ([
                        ...tileSets.fortressTiles,
                        ...tileSets.opportunityTiles,
                        ...tileSets.blindBoxTiles,
                        ...tileSets.goldCenterTiles
                    ].includes(tileSet)) {
                        this.setColor(tileSet, '', team.teamId.toString())
                    } else {
                        this.setColor(tileSet, GameDisplay.teamColorTrans(team.teamId), team.teamId.toString())
                    }
                    this.setColor(tileSet, GameDisplay.teamColorTrans(team.teamId), team.teamId.toString())
                })
            }
        }
    }

    setMode(array: Array<number>, mode: 'origin' | 'fight-fortress' | 'gold-center' | 'black-swamp' | 'chance-place' | 'secret-place') {
        for (let i = 0; i < array.length; i++) {
            this.hexArray[array[i]].mode = mode;
        }
    }

    setTotalMode(blackSwapTiles: Array<number>, fortressTiles: Array<number>, opportunityTiles: Array<number>, blindBoxTiles: Array<number>, goldCenterTiles: Array<number>) {
        this.setMode(blackSwapTiles, 'black-swamp')
        this.setMode(fortressTiles, 'fight-fortress')
        this.setMode(opportunityTiles, 'black-swamp')
        this.setMode(blindBoxTiles, 'secret-place')
        this.setMode(goldCenterTiles, 'gold-center')
    }

    setColor(id: number, color: string, text?: string) {
        if (color !== '') this.hexArray[id].fill = color
        this.hexArray[id].text = text
    }
}

interface hexCol {
    x: number
    y: number
    rows: number
    radius?: number
}
