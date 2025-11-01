import { createStore } from "vuex";
import snackBarModule from "@/store/snackbar";
import gameModule from "@/store/game";

export default createStore({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    snackBarModule,
    gameModule,
  },
});
