enum SW {
    Disbled = 0,
    Enabled = 1
}

//% color="#3487FF" icon="\uf185" weight=1
//% groups="['x1', 'x2']"
namespace Mosiwi_cube {
    let display_buf = pins.createBuffer(0);
    let display_buf_index: number = 0;
    let display_sw: number = 0;
    let cube_layer: number = 0;
    let cube_number: number = 0;

    //% block="Cube init $cube_num"
    //% cube_num.min=0 cube_num.max=3
    export function cube_init(cube_num: number) {
        pins.spiFrequency(25000000);
        pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13);
        pins.spiFormat(8, 0);

        pins.digitalWritePin(DigitalPin.P16, 0);
        display_buf = pins.createBuffer(cube_num * 8);
        cube_number = cube_num;
    }

    //% block="Cube display $sw"
    export function cube_display(sw: SW) {
        display_sw = sw;
    }


    /**
     * A 16-bit binary number is mapped to a layer of 16 leds: 0bxxxxxxxxxxxxxxxx --> LED0~LED15
     * @param LEDs
     */
    //% block="Update Cube: $cube Layer: $layer LED0-LED15: $LEDs"
    //% cube.min=0 cube.max=3 layer.min=0 layer.max=3
    //% inlineInputMode=inline
    export function cube_update_layer(cube: number, layer: number, LEDs: number) {
        if (cube < cube_number) {
            display_buf[cube * 8 + layer * 2] = LEDs;
            display_buf[cube * 8 + layer * 2 + 1] = LEDs >> 8;
        }
    }


    /**
     * A 4*4 image parameter.
     * @param LEDs
     */
    //% block="Update Cube: $cube Layer: $layer LED0-LED15: $LEDs Img"
    //% cube.min=0 cube.max=3 layer.min=0 layer.max=3
    //% inlineInputMode=inline
    export function layer(cube: number, layer: number, LEDs: Image) {
        if (cube < cube_number) {
            let layerLed = 0;
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    if (LEDs.pixel(0, 0) == true)
                        layerLed |= 1 << (y * 4 + x);
                }
            }
            display_buf[cube * 8 + layer * 2] = layerLed;
            display_buf[cube * 8 + layer * 2 + 1] = layerLed >> 8;
        }
    }


    //% block="Update Cube: $cube X: $x Y: $y Z: $z LED: $Off_On"
    //% cube.min=0 cube.max=3 x.min=0 x.max=3 y.min=0 y.max=3 z.min=0 z.max=3 Off_On.min=0 Off_On.max=1
    //% inlineInputMode=inline
    export function cube_update_xyz(cube: number, x: number, y: number, z: number, Off_On: number) {
        if (cube < cube_number) {
            if (Off_On == 1) {
                if (y < 2) {
                    display_buf[cube * 8 + z * 2] |= 1 << (x + (y * 4));
                } else {
                    display_buf[cube * 8 + z * 2 + 1] |= 1 << (x + ((y - 2) * 4));
                }
            }
            if (Off_On == 0) {
                if (y < 2) {
                    display_buf[cube * 8 + z * 2] &= ~(1 << (x + (y * 4)));
                } else {
                    display_buf[cube * 8 + z * 2 + 1] &= ~(1 << (x + ((y - 2) * 4)));
                }
            }
        }
    }


    function spi_wrete(dat_l: number, dat_h: number, layer: number) {
        let current_cube = ~~(display_buf_index / 8);
        pins.digitalWritePin(DigitalPin.P16, 0);
        pins.spiWrite(layer);
        pins.spiWrite(dat_h);
        pins.spiWrite(dat_l);
        for (let i = 0; i < current_cube; i++) {
            pins.spiWrite(0);
            pins.spiWrite(0);
            pins.spiWrite(0);
        }
        pins.digitalWritePin(DigitalPin.P16, 1);
        pins.digitalWritePin(DigitalPin.P16, 0);
        for (let j = 0; j < cube_number - current_cube; j++) {
            pins.spiWrite(0);
            pins.spiWrite(0);
            pins.spiWrite(0);
        }
    }


    // This function is executed every 1 milliseconds.
    /*loops.everyInterval(1, function () {
        if (display_sw == SW.Enabled) {
            switch (cube_layer) {
                case 0: spi_wrete(display_buf[display_buf_index], 0xe); cube_layer = 1; break;
                case 1: spi_wrete(display_buf[display_buf_index], 0xd); cube_layer = 2; break;
                case 2: spi_wrete(display_buf[display_buf_index], 0xb); cube_layer = 3; break;
                case 3: spi_wrete(display_buf[display_buf_index], 0x7); cube_layer = 0; break;
            }

            display_buf_index = display_buf_index + 1;
            if (display_buf_index >= cube_number * 4) display_buf_index = 0;
        }
    })*/

    control.inBackground(function () {
        while (1) {
            display_buf[0] = 65535;
            if (display_sw == 1) {
                switch (cube_layer) {
                    case 0: spi_wrete(display_buf[display_buf_index], display_buf[display_buf_index + 1], 0xe); cube_layer = 1; break;
                    case 1: spi_wrete(display_buf[display_buf_index], display_buf[display_buf_index + 1], 0xd); cube_layer = 2; break;
                    case 2: spi_wrete(display_buf[display_buf_index], display_buf[display_buf_index + 1], 0xb); cube_layer = 3; break;
                    case 3: spi_wrete(display_buf[display_buf_index], display_buf[display_buf_index + 1], 0x7); cube_layer = 0; break;
                }

                display_buf_index += 2;
                if (display_buf_index == cube_number * 8) display_buf_index = 0;
            }
        }
    })

}
