declare module "qrcode" {
    export interface QRCodeOptions {
        type?: string;
        errorCorrectionLevel?: string;
        margin?: number;
        width?: number;
        color?: {
            dark?: string;
            light?: string;
        };
    }

    export function toString(
        text: string,
        options?: QRCodeOptions
    ): Promise<string>;

    export function toBuffer(
        text: string,
        options?: QRCodeOptions
    ): Promise<Buffer>;

    export function toDataURL(
        text: string,
        options?: QRCodeOptions
    ): Promise<string>;
}
