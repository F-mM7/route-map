import mitaLine from "./mitaLine";
import shinjukuLine from "./shinjukuLine";
import odakyuLine from "./odakyuLine";
import inokashiraLine from "./inokashiraLine";
import chuoSobuLine from "./chuoSobuLine";
import yamanoteLine from "./yamanoteLine";

const lines = {
  三田線: mitaLine,
  新宿線: shinjukuLine,
  小田急線: odakyuLine,
  井の頭線: inokashiraLine,
  中央総武線: chuoSobuLine,
  山手線: yamanoteLine,
};

export default lines;
