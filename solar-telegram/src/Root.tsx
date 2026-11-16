import {Composition} from "remotion";
import {SolarTelegram} from "./SolarTelegram";
import {SolarTelegramV2} from "./v2/SolarTelegramV2";
import {SolarTelegramV3} from "./v3/SolarTelegramV3";
import {SolarTelegramV4} from "./v4/SolarTelegramV4";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="SolarTelegram" component={SolarTelegram} width={1080} height={1920}
      fps={30} durationInFrames={1860} defaultProps={{mixReady: true, detail: 1}} />
    <Composition id="SolarTelegramV2" component={SolarTelegramV2} width={1080} height={1920}
      fps={30} durationInFrames={1740} defaultProps={{detail: 1, captions: true, mixReady: true}} />
    <Composition id="SolarTelegramV3" component={SolarTelegramV3} width={1080} height={1920}
      fps={30} durationInFrames={1740} defaultProps={{detail: 1, captions: true, mixReady: true}} />
    <Composition id="SolarTelegramV4" component={SolarTelegramV4} width={1080} height={1920}
      fps={30} durationInFrames={1740} defaultProps={{detail: 1, captions: true, mixReady: true}} />
  </>
);
