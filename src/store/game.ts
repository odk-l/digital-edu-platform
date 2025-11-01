/**
 * 游戏状态管理模块（简化版）
 * 
 * 设计原则：
 * 1. 只存储 gameStatus，gameId 从 gameStatus.id 获取
 * 2. 只提供 gameStatus 和 gameState，不重复提供快捷访问
 */

import { Module } from "vuex";
import { useGameStates } from "@/composables/useGameState";
import { ApiMap } from "@/api/type";

interface GameModuleState {
  gameStatus: ApiMap["/game/status/:id"]["resp"] | null;
}

const gameModule: Module<GameModuleState, any> = {
  namespaced: true,

  state: () => ({
    gameStatus: null,
  }),

  mutations: {
    // 更新游戏状态
    UPDATE_GAME_STATUS(state, status: ApiMap["/game/status/:id"]["resp"]) {
      state.gameStatus = status;
    },

    // 清空游戏状态
    CLEAR_GAME_STATUS(state) {
      state.gameStatus = null;
    },
  },

  actions: {
    // 更新游戏状态
    updateGameStatus({ commit }, status: ApiMap["/game/status/:id"]["resp"]) {
      commit("UPDATE_GAME_STATUS", status);
    },

    // 清空游戏状态
    clearGameStatus({ commit }) {
      commit("CLEAR_GAME_STATUS");
    },
  },

  getters: {
    // 获取游戏状态
    gameStatus: (state) => state.gameStatus,

    // 获取游戏ID（从 gameStatus 中获取）
    gameId: (state) => state.gameStatus?.id ?? 0,

    // 获取游戏状态管理器（响应式）
    gameState: (state) => {
      return useGameStates(() => state.gameStatus);
    },
  },
};

export default gameModule;
