// En développement (expo start) : le back qui tourne sur ton PC.
// Dans l'app buildée (EAS) : l'API hébergée sur Render.
const LOCAL_API_URL = "http://192.168.1.99:3000";
// const LOCAL_API_URL = "http://192.168.1.21:3000";
const PROD_API_URL = "https://evant-calendar-back.onrender.com";

export const API_BASE_URL = __DEV__ ? LOCAL_API_URL : PROD_API_URL;
