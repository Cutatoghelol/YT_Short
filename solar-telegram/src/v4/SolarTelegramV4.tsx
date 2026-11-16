import {TelegramEdition, type TelegramProps} from "../v3/SolarTelegramV3";
import words from "../../public/voice-v4/words.json";
import {addHorizon, makePedestrian, makePoleFlashes} from "./outdoors";
import {act, cameraAt, shotAt} from "./story";
import events from "./cues.json";

const edition = {
  actions: {act,cameraAt,shotAt}, events, captions: words, audio: "voice-v4",
  street: {addHorizon,makePedestrian}, country: {addHorizon,makePoleFlashes},
};

export const SolarTelegramV4: React.FC<TelegramProps> = (props) => <TelegramEdition {...props} edition={edition} />;
