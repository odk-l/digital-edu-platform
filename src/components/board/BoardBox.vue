<template>
  <div class="d-flex flex-column" style="height: 100vh">
    <div
      v-if="gameState.isMoving?.value"
      class="svg-header d-flex justify-center text-h5 mt-6"
      style="flex: 1"
    >
      当前为
      <div
        class="mx-2"
        :style="`color: ${GameDisplay.teamColorTrans(selectingTeam)}`"
      >
        第 {{ selectingTeam }} 组
      </div>
      的回合，还剩余 {{ actionLeft }} 步
    </div>
    <div style="flex: 18">
      <svg style="height: 100%; width: 100%">
        <Hex
          v-for="(item, index) of hexGrid.hexArray"
          :key="index"
          :x="item.x"
          :y="item.y"
          :radius="item.radius"
          @onHexClick="onHexClick"
          :id="index"
          :mode="item.mode"
          :fill="item.fill"
          :text="item.text"
        />
      </svg>
    </div>
    <div
      v-if="gameState.isMoving?.value"
      class="d-flex justify-space-around px-12 mb-4"
      style="flex: 1"
    >
      <v-btn
        width="200"
        class="font-weight-bold"
        color="red-lighten-1"
        @click="handleReset"
        >重置</v-btn
      >
      <v-btn
        width="200"
        class="font-weight-bold"
        color="primary"
        @click="useTileOccupy"
        >保存</v-btn
      >
    </div>
  </div>
  <EventTip v-if="et.show" :title="et.title" :duration="et.time"></EventTip>
  <v-dialog v-model="showDialog" width="auto">
    <ConfirmDialog
      title="触发单组挑战任务"
      text="请老师决定该组增加步数"
      @confirm="
        () => {
          handleChanceLand(true);
        }
      "
      @cancel="
        () => {
          handleChanceLand(false);
        }
      "
    >
      <v-number-input
        v-model="selectedNumber"
        :reverse="false"
        controlVariant="default"
        label=""
        :hideInput="false"
        :inset="false"
        variant="outlined"
        density="compact"
        :min="0"
        :max="3"
      ></v-number-input>
    </ConfirmDialog>
  </v-dialog>
</template>

<script setup lang="ts">
import Hex from "@/components/HexUnit.vue";
import { HexGrid } from "@/types/hex";
import { defineProps, defineEmits, watch, reactive, ref, onMounted,computed } from "vue";
import { useApi } from "@/api/handler";
import { game } from "@/api";
import { ApiMap } from "@/api/type";
import { GameDisplay, GameUtils } from "@/utils";
import EventTip from "@/components/board/EventTip.vue";
import { eventTip } from "@/types/event";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { useStore } from "vuex";

const props = defineProps<{
  originX: number;
  originY: number;
  radius: number;
}>();

const store=useStore()
const et = reactive(new eventTip());
const emits = defineEmits(["update"]);
const selectingTeam = ref<number>(0);
const actionLeft = ref<number>(0);
const tileSelected = ref<Array<number>>([]);
const selectedNumber = ref<number>(3);
const GameStatus = computed(() => store.getters["gameModule/gameStatus"]);
const gameState = computed(() => store.getters["gameModule/gameState"]);

const goldenCenterOccupy = ref<{ b: boolean; id: number }>({ b: false, id: 0 });
const blindBoxOccupy = ref<{ b: boolean; ids: Array<number> }>({
  b: false,
  ids: [],
});
const chanceLandOccupy = ref<{ b: boolean; id: number; s: boolean }>({
  b: false,
  id: 0,
  s: false,
});
const showDialog = ref<boolean>(false);

let tileSets = reactive<ApiMap["/game/occupyStatus/:gameId"]["resp"]>({
  totalTiles: 0,
  blackSwampTiles: [],
  blindBoxTiles: [],
  fortressTiles: [],
  goldCenterTiles: [],
  opportunityTiles: [],
  teams: [],
});

function onHexClick(id: number) {
  if (actionLeft.value === 0) return;
  if (
    tileSets.teams
      .flat()
      .map((item) => item.occupiedTiles)
      .flat()
      .includes(id)
  )
    return;
  if (tileSelected.value.includes(id)) return;
  if (tileSets.blackSwampTiles.includes(id)) return;
  if (tileSets.goldCenterTiles.includes(id)) {
    goldenCenterOccupy.value = { b: true, id: id };
    et.showEventTip("触发黄金中心事件，步数加 5");
    actionLeft.value += 5;
  }
  if (tileSets.blindBoxTiles.slice(0, 2).includes(id)) {
    blindBoxOccupy.value.b = true;
    blindBoxOccupy.value.ids.push(id);
    et.showEventTip("触发天降领地事件，步数加 2");
    actionLeft.value += 2;
  }
  if (tileSets.blindBoxTiles[tileSets.blindBoxTiles.length - 2] === id) {
    et.showEventTip("触发图片论述事件，本回合结束时进行");
  }
  if (tileSets.blindBoxTiles[tileSets.blindBoxTiles.length - 1] === id) {
    et.showEventTip("触发五词对抗赛事件，本回合结束时进行");
  }
  if (tileSets.fortressTiles.slice(0, 2).includes(id)) {
    et.showEventTip("本回合结束将进行双音节成语比赛");
  }
  if (tileSets.fortressTiles.slice(-2).includes(id)) {
    et.showEventTip("本回合结束将进行成语抢答比赛");
  }
  if (tileSets.opportunityTiles.includes(id)) {
    chanceLandOccupy.value.b = true;
    chanceLandOccupy.value.id = id;
    showDialog.value = true;
  }
  hexGrid.setColor(
    id,
    GameDisplay.teamColorTrans(selectingTeam.value),
    selectingTeam.value.toString()
  );
  actionLeft.value -= 1;
  tileSelected.value.push(id);
}

function handleReset() {
  useTileSets();
  selectingTeam.value = 0;
  tileSelected.value = [];
  useUnselectedList();
}

function handleChanceLand(b: boolean) {
  chanceLandOccupy.value.s = b;
  if (b) {
    actionLeft.value += selectedNumber.value;
    showDialog.value = false;
  } else {
    showDialog.value = false;
  }
}

const hexGrid: HexGrid = reactive(
  new HexGrid(props.originX, props.originY, props.radius)
);

watch(
  () => [props.originX, props.originY, props.radius, tileSets],
  () => {
    hexGrid.render(
      props.originX,
      props.originY,
      props.radius,
      tileSets,
      GameStatus.value.chessRound
    );
  }
);

const useGameInit = () => {
  if (!GameStatus.value) return;
  const originSet = GameUtils.getOriginTileSet();
  useApi({
    api: game.InitGame(
      GameStatus.value.id,
      285,
      originSet.blackSwampTiles,
      GameUtils.blindBoxRandom(originSet.blindBoxTiles),
      GameUtils.fortressRandom(originSet.fortressTiles),
      originSet.goldCenterTiles,
      originSet.opportunityTiles
    ),
    onSuccess: () => {
      emits("update");
      useTileSets();
    },
    tip: "游戏初始化成功",
  });
};

const useUnselectedList = () => {
  useApi({
    api: game.UnselectedList(GameStatus.value.id),
    onSuccess: (resp) => {
      for (const item of resp.data as ApiMap["/game/unselected/:gameId"]["resp"]) {
        if (item.assignCount !== 0) {
          if (item.teamId === selectingTeam.value) return;
          selectingTeam.value = item.teamId;
          actionLeft.value = item.assignCount;
          return;
        }
      }
    },
  });
};

const useTileSets = () => {
  useApi({
    api: game.TileSets(GameStatus.value.id),
    onSuccess: (resp) => {
      tileSets = resp.data as ApiMap["/game/occupyStatus/:gameId"]["resp"];
      hexGrid.render(
        props.originX,
        props.originY,
        props.radius,
        tileSets,
        GameStatus.value.chessRound
      );
    },
  });
};

const useTileOccupy = () => {
  useApi({
    api: game.TileOccupy({
      gameId: GameStatus.value.id,
      teamId: selectingTeam.value,
      tileIds: tileSelected.value,
      triggerBlindBox: blindBoxOccupy.value.b,
      triggerGoldCenter: goldenCenterOccupy.value.b,
      blindBoxTileIds: blindBoxOccupy.value.ids,
      goldCenterTileId: goldenCenterOccupy.value.id,
      challengeSuccess: chanceLandOccupy.value.s,
      chanceLandTileId: chanceLandOccupy.value.id,
      triggerChanceLand: chanceLandOccupy.value.b,
    }),
    onSuccess: () => {
      useUnselectedList();
      useTileSets();
      tileSelected.value = [];
      emits("update");
    },
    tip: "上传成功",
  });
};

watch(
  () => gameState.value,
  (newState) => {
    if (newState.isProposalInit?.value) useGameInit();
    if (newState.isMoving?.value) useUnselectedList();
    if (!newState.isProposalInit?.value) useTileSets();
    if (gameState.value.currentRound?.value === 3 && newState.value.isUploadGrade?.value) {
      et.showEventTip("机会宝地已在地图上出现");
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss"></style>
