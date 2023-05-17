/* -------------------------------------------------------------------------- */
/*                      Ficher de gestion de la Titlebar                      */
/* -------------------------------------------------------------------------- */

const { Titlebar, TitlebarColor } = require('custom-electron-titlebar');

window.addEventListener("DOMContentLoaded", () => {

    new Titlebar({
      backgroundColor: TitlebarColor.fromHex('#E7E7F3'),
      menu: null,
      icon: '',
    });
  });
  