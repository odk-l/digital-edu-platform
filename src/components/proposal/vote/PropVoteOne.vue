<template>
  <div>
    <div class="d-flex justify-space-between ma-4">
      <div class="d-flex">
        <v-text-field
          width="200"
          prepend-inner-icon="mdi-account"
          height="20"
          density="compact"
          variant="outlined"
          placeholder="请输入小组数"
          rounded
          hide-details
          :min="0"
          v-model="proposalNum"
        ></v-text-field>
      </div>
      <v-btn
        v-if="gameState?.isRound1Submit?.value"
        variant="outlined"
        color="primary"
        @click="useSubmitProposal"
        >提交提案</v-btn
      >
      <v-btn
        v-if="gameState?.isRound1Vote?.value && !isKnockout"
        variant="outlined"
        color="primary"
        @click="useSubmitVote"
        >提交投票</v-btn
      >
      <v-btn
        v-if="gameState?.isRound1Vote?.value && isKnockout"
        variant="outlined"
        color="primary"
        @click="emits('update')"
        >开始淘汰赛</v-btn
      >
    </div>
    <v-card rounded min-height="650" class="ma-4">
      <v-data-table
        :items="tableData"
        hide-default-footer
        no-data-text="请先提交游戏设置"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>
              <v-icon
                color="medium-emphasis"
                icon="mdi-book-multiple"
                size="x-small"
                start
              ></v-icon>
              提案列表
            </v-toolbar-title>
          </v-toolbar>
        </template>

        <!--      eslint-disable-next-line vue/valid-v-slot-->
        <template v-slot:item.是否被选中="{ value }">
          <v-chip
            v-if="gameState?.isRound1Vote?.value && isKnockout"
            :color="value ? 'green' : 'red'"
            >{{ value ? "选中" : "落选" }}</v-chip
          >
        </template>

        <!--      eslint-disable-next-line vue/valid-v-slot-->
        <template v-slot:item.操作="{ index }">
          <v-icon
            v-if="gameState.isRound1Submit?.value"
            color="medium-emphasis"
            icon="mdi-pencil"
            size="small"
            @click="handleEditProp(index)"
          >
          </v-icon>
          <v-btn
            v-if="gameState.isRound1Vote?.value && !isKnockout"
            class="px-2"
            prepend-icon="mdi-vote"
            @click="
              () => {
                showOverlay = true;
                proposalIndex = index;
              }
            "
            variant="text"
            >投票</v-btn
          >
        </template>
      </v-data-table>
    </v-card>
  </div>
  <v-overlay v-model="showOverlay" class="align-center justify-center">
    <SubmitPropOne
      v-if="gameState.isRound1Submit?.value"
      :team="proposalList[proposalIndex]"
      :list="teamList"
      @submit="handleSubmitPropOne"
      @close="showOverlay = false"
    />
    <SubmitVote
      v-if="gameState.isRound1Vote?.value && !isKnockout"
      class="pa-8"
      width="600"
      :list="teamList"
      :votes="voteMap?.value?.get(proposalIndex) || []"
      :proposer-id="proposalList[proposalIndex].id"
      @submit="handleVote"
      @close="showOverlay = false"
    />
  </v-overlay>
  <v-overlay v-model="isTile" class="align-center justify-center">
    <TileSelect
      v-if="isTile"
      :tile-options="tileOptions"
      @close="isTile = false"
      @submit="useSubmitTile"
    />
  </v-overlay>
</template>

<script setup lang="ts">
import { defineEmits, ref, watch, computed } from "vue";
import { ApiMap } from "@/api/type";
import { useApi } from "@/api/handler";
import { game, proposal, team } from "@/api";
import SubmitPropOne from "@/components/proposal/vote/SubmitPropOne.vue";
import store from "@/store";
import SubmitVote from "@/components/proposal/vote/SubmitVote.vue";
import TileSelect from "../TileSelect.vue";
import { useStore } from "vuex";

const store1 = useStore();
const emits = defineEmits(["update"]);
const GameStatus = computed(() => store1.getters["gameModule/gameStatus"]);
const gameState = computed(() => store1.getters["gameModule/gameState"]);
const showOverlay = ref<boolean>(false);
const teamList = ref<ApiMap["/team/game/:id"]["resp"]["teams"]>([]);
const proposalNum = ref<number | null>(null);

const proposalList = ref<ApiMap["/proposal/upload/first"]["req"]["proposals"]>(
  []
);
const voteForm = ref<Array<{ data: string; teamId: number }>>([]);
const proposalIndex = ref<number>(0);
const voteMap = ref(
  new Map<number, { teamId: number; proposalId: number; score: number }[]>()
);
const removedList = ref<Array<number>>([]);
let isTile = ref(false);
const tileOptions = ref<{ label: string; value: number }[]>([]);
const isKnockout = computed(() => {
  return (
    proposalList.value &&
    proposalList.value.filter((item: any) => item.isSelected).length > 0
  );
});

function handleEditProp(index: number) {
  proposalIndex.value = index;
  showOverlay.value = true;
}

function handleVote(
  input: { teamId: number; proposalId: number; score: number }[]
) {
  // 存储投票数据
  voteMap.value.set(proposalIndex.value, input);

  // 同时更新 proposalList 中的提案信息
  if (input.length > 0) {
    const involvedTeamIds = input.map((vote) => vote.teamId);
    const scoreDistribution = input.map((vote) => vote.score);

    // 更新提案的参与小组和分值分配
    proposalList.value[proposalIndex.value] = {
      ...proposalList.value[proposalIndex.value],
      involvedTeamIds: involvedTeamIds,
      scoreDistribution: scoreDistribution,
    };
  }

  showOverlay.value = false;
}

function handleSubmitPropOne(payload: {
  id: number;
  ids: number[];
  score: number[];
}) {
  proposalList.value[proposalIndex.value] = {
    proposerTeamId: payload.id,
    involvedTeamIds: payload.ids,
    scoreDistribution: payload.score,
  };
  console.log("提案:", proposalList.value);
  showOverlay.value = false;
}

// 计算每个提案的实时投票数
const getVoteCount = (proposalIndex: number) => {
  if (!voteMap?.value) return 0;
  const votes = voteMap.value.get(proposalIndex);
  if (!votes) return 0;
  return votes.reduce((sum, vote) => sum + vote.score, 0);
};

const tableData = computed(() => {
  if (!proposalList.value) return [];
  if (gameState.value?.isRound1Vote?.value && isKnockout.value) {
    return proposalList.value.map((item: any, index: number) => ({
      提出提案: `第 ${item.proposerTeamId} 组`,
      参与小组: item.involvedTeamIds
        .map((i: number) => `第 ${i} 组`)
        .join("，"),
      分值分配: item.scoreDistribution.map((i: number) => `${i} 分`).join("，"),
      总票数: `${item.voteCount || getVoteCount(index)} 票`,
      是否被选中: item.isSelected,
    }));
  } else {
    console.log("投票", proposalList.value);
    return proposalList.value.map((item: any, index: number) => {
      const currentVoteCount = getVoteCount(index);
      return {
        提出提案: `第 ${item.proposerTeamId} 组`,
        参与小组: item.involvedTeamIds
          .map((i: number) => `第 ${i} 组`)
          .join("，"),
        分值分配: item.scoreDistribution
          .map((i: number) => `${i} 分`)
          .join("，"),
        当前票数: currentVoteCount > 0 ? `${currentVoteCount} 票` : "未投票",
        操作: true,
      };
    });
  }
});

const useProposalList = () => {
  if (!GameStatus.value) return;
  if (gameState.value?.isProposalInit?.value) return;
  console.log(gameState.value.currentRound?.value); // 如果还在初始化阶段，不加载提案列表
  useApi({
    api: proposal.ProposalList(
      GameStatus.value.id,
      gameState.value.currentRound?.value
    ),
    onSuccess: (resp) => {
      proposalList.value = resp.data as ApiMap["/proposal/list"]["resp"];
      console.log("isKnockout:", gameState.value?.isKnockout?.value);
      voteForm.value = proposalList.value.map((item) => ({
        data: "",
        teamId: item.proposerTeamId,
      }));
    },
  });
};

const useTeamList = () => {
  if (!GameStatus.value) return;
  useApi({
    api: team.TeamList(GameStatus.value.id),
    onSuccess: (resp) => {
      teamList.value = (
        resp.data as ApiMap["/team/game/:id"]["resp"]
      ).teams.filter((item: any) => !removedList.value.includes(item.teamId));
    },
  });
};

const useSubmitProposal = () => {
  if (!proposalNum.value) {
    store.dispatch("snackBarModule/showError", "请填写参与的小组个数");
    return;
  }
  useApi({
    api: proposal.FirstProposal({
      gameId: GameStatus.value!.id,
      num: Number(proposalNum.value) ?? 0,
      proposals: proposalList.value,
    }),
    onSuccess: () => {
      emits("update");
    },
    tip: "上传成功",
  });
};

const getVotesList = (): ApiMap["/proposal/vote"]["req"]["votes"] => {
  let votesList: ApiMap["/proposal/vote"]["req"]["votes"] = [];
  voteMap.value.forEach((value) => {
    votesList.push(...value);
  });
  return votesList;
};
function getTeamIdByProposalId(proposalId: number) {
  const vote = proposalList.value.find((v: any) => v.id === proposalId);
  return vote ? vote.proposerTeamId : null;
}

const useSubmitVote = () => {
  const votesList = getVotesList();
  if (new Set(votesList.map((value) => value.teamId)).size < votesList.length) {
    store.dispatch("snackBarModule/showError", "存在重复投票");
    return;
  }

  const voteCountMap: Record<number, number> = {};
  votesList.forEach((vote) => {
    voteCountMap[vote.proposalId] =
      (voteCountMap[vote.proposalId] || 0) + vote.score;
  });
  const maxVote = Math.max(...Object.values(voteCountMap));
  const topProposals = Object.entries(voteCountMap)
    .filter(([, count]) => count === maxVote)
    .map(([proposalId]) => Number(proposalId));
  if (topProposals.length > 1) {
    isTile.value = true;
    tileOptions.value = topProposals.map((id) => ({
      label: `${getTeamIdByProposalId(id)}组提案`,
      value: id,
    }));
  } else {
    useApi({
      api: proposal.SubmitVote({
        gameId: GameStatus.value!.id,
        round: gameState.value.currentRound?.value,
        votes: votesList,
        hasTie: isTile.value,
      }),
      onSuccess: () => {
        useProposalList();
      },
      tip: "上传成功",
    });
  }
};
const useSubmitTile = (id: number) => {
  const votesList = getVotesList();
  useApi({
    api: proposal.SubmitVote({
      gameId: GameStatus.value!.id,
      round: gameState.value.currentRound?.value,
      hasTie: isTile.value,
      votes: votesList,
      winnerProposalId: id,
    }),
    onSuccess: () => {
      emits("update");
    },
    tip: "上传成功",
  });
};
const useRemovedList = () => {
  if (!GameStatus.value) return;
  useApi({
    api: game.RemoveList(GameStatus.value.id),
    onSuccess: (resp) => {
      removedList.value = resp.data as Array<number>;
      useTeamList();
    },
  });
};

watch(
  () => GameStatus.value,
  () => {
    useProposalList();
    useRemovedList();
  },
  { immediate: true }
);
</script>
