/**
 * 游戏状态管理 Composable
 * 统一管理游戏状态，替代分散的 GameStatus 判断
 */

import { computed, ref, watch } from 'vue'
import { ApiMap } from '@/api/type'

// 简化的状态枚举
export enum SimpleGameState {
  // 棋盘赛
  CHESS_UPLOAD_GRADE = 'CHESS_UPLOAD_GRADE',     // 上传成绩
  CHESS_UPLOAD_LAND = 'CHESS_UPLOAD_LAND',       // 上传领地
  CHESS_MOVING = 'CHESS_MOVING',                 // 走棋中
  CHESS_SETTLEMENT = 'CHESS_SETTLEMENT',         // 结算

  // 提案赛
  PROPOSAL_INIT = 'PROPOSAL_INIT',               // 初始化
  PROPOSAL_ORDER = 'PROPOSAL_ORDER',             // 设置顺序
  PROPOSAL_ROUND_1_SUBMIT = 'PROPOSAL_ROUND_1_SUBMIT',   // 第一轮-提交
  PROPOSAL_ROUND_1_VOTE = 'PROPOSAL_ROUND_1_VOTE',       // 第一轮-投票
  PROPOSAL_ROUND_2_SUBMIT = 'PROPOSAL_ROUND_2_SUBMIT',   // 第二轮-提交
  PROPOSAL_ROUND_2_DEBATE = 'PROPOSAL_ROUND_2_DEBATE',   // 第二轮-辩论
  PROPOSAL_ROUND_2_SCORE = 'PROPOSAL_ROUND_2_SCORE',     // 第二轮-评分
  PROPOSAL_ROUND_3_SUBMIT = 'PROPOSAL_ROUND_3_SUBMIT',   // 第三轮-提交
  PROPOSAL_ROUND_3_VOTE = 'PROPOSAL_ROUND_3_VOTE',       // 第三轮-投票
  PROPOSAL_KNOCKOUT = 'PROPOSAL_KNOCKOUT',       // 淘汰赛

  // 结束
  GAME_FINISHED = 'GAME_FINISHED',
}

/**
 * 从后端状态推断当前游戏状态
 */
function inferGameState(status: ApiMap['/game/status/:id']['resp']): SimpleGameState {
  // 游戏结束
  if (status.status === 2) {
    return SimpleGameState.GAME_FINISHED
  }

  // 棋盘赛阶段
  if (status.stage === 1) {
    switch (status.chessPhase) {
      case 0: return SimpleGameState.CHESS_UPLOAD_GRADE
      case 1: return SimpleGameState.CHESS_UPLOAD_LAND
      case 2: return SimpleGameState.CHESS_MOVING
      case 3: return SimpleGameState.CHESS_SETTLEMENT
    }
  }

  // 提案赛阶段
  if (status.stage === 2) {
    if (status.proposalStage === 0) return SimpleGameState.PROPOSAL_INIT
    if (status.proposalStage === 1) return SimpleGameState.PROPOSAL_ORDER
    if (status.proposalStage === 4) return SimpleGameState.PROPOSAL_KNOCKOUT

    // proposalStage >= 2，根据轮次判断
    if (status.proposalRound === 1) {
      return status.proposalStage === 2
        ? SimpleGameState.PROPOSAL_ROUND_1_SUBMIT
        : SimpleGameState.PROPOSAL_ROUND_1_VOTE
    }

    if (status.proposalRound === 2) {
      if (status.proposalStage === 2) return SimpleGameState.PROPOSAL_ROUND_2_SUBMIT
      if (status.proposalStage === 3) return SimpleGameState.PROPOSAL_ROUND_2_DEBATE
      return SimpleGameState.PROPOSAL_ROUND_2_SCORE
    }

    if (status.proposalRound === 3) {
      return status.proposalStage === 2
        ? SimpleGameState.PROPOSAL_ROUND_3_SUBMIT
        : SimpleGameState.PROPOSAL_ROUND_3_VOTE
    }
  }

  return SimpleGameState.PROPOSAL_INIT
}

/**
 * 游戏状态 Composable
 */
export function useGameStates(gameStatus: (() => ApiMap['/game/status/:id']['resp'] | null) | ApiMap['/game/status/:id']['resp'] | null) {
  const currentState = computed(() => {
    const status = typeof gameStatus === 'function' ? gameStatus() : gameStatus
    if (!status) return null
    return inferGameState(status)
  })

  // ============ 阶段判断 ============
  const isChessPhase = computed(() => {
    return currentState.value?.startsWith('CHESS_') ?? false
  })

  const isProposalPhase = computed(() => {
    return currentState.value?.startsWith('PROPOSAL_') ?? false
  })

  const isFinished = computed(() => {
    return currentState.value === SimpleGameState.GAME_FINISHED
  })

  // ============ 具体状态判断 ============
  const isUploadGrade = computed(() => {
    return currentState.value === SimpleGameState.CHESS_UPLOAD_GRADE
  })

  const isUploadLand = computed(() => {
    return currentState.value === SimpleGameState.CHESS_UPLOAD_LAND
  })

  const isMoving = computed(() => {
    return currentState.value === SimpleGameState.CHESS_MOVING
  })

  const isSettlement = computed(() => {
    return currentState.value === SimpleGameState.CHESS_SETTLEMENT
  })

  const isProposalInit = computed(() => {
    return currentState.value === SimpleGameState.PROPOSAL_INIT
  })

  const isProposalOrder = computed(() => {
    return currentState.value === SimpleGameState.PROPOSAL_ORDER
  })

  const isRound1Submit = computed(() => {
    return currentState.value === SimpleGameState.PROPOSAL_ROUND_1_SUBMIT
  })

  const isRound1Vote = computed(() => {
    return currentState.value === SimpleGameState.PROPOSAL_ROUND_1_VOTE
  })

  const isRound2Submit = computed(() => {
    return currentState.value === SimpleGameState.PROPOSAL_ROUND_2_SUBMIT
  })

  const isRound2Debate = computed(() => {
    return currentState.value === SimpleGameState.PROPOSAL_ROUND_2_DEBATE
  })

  const isRound2Score = computed(() => {
    return currentState.value === SimpleGameState.PROPOSAL_ROUND_2_SCORE
  })

  const isRound3Submit = computed(() => {
    return currentState.value === SimpleGameState.PROPOSAL_ROUND_3_SUBMIT
  })

  const isRound3Vote = computed(() => {
    return currentState.value === SimpleGameState.PROPOSAL_ROUND_3_VOTE
  })

  const isKnockout = computed(() => {
    return currentState.value === SimpleGameState.PROPOSAL_KNOCKOUT
  })

  // ============ 轮次信息 ============
  const currentRound = computed(() => {
    const status = typeof gameStatus === 'function' ? gameStatus() : gameStatus
    if (!status) return 0
    return status.chessRound || status.proposalRound
  })

  const proposalStage = computed(() => {
    const status = typeof gameStatus === 'function' ? gameStatus() : gameStatus
    if (!status) return 0
    return status.proposalStage
  })

  // ============ 状态描述 ============
  const stateDescription = computed(() => {
    const descriptions: Record<SimpleGameState, string> = {
      [SimpleGameState.CHESS_UPLOAD_GRADE]: '上传成绩阶段',
      [SimpleGameState.CHESS_UPLOAD_LAND]: '上传领地阶段',
      [SimpleGameState.CHESS_MOVING]: '走棋阶段',
      [SimpleGameState.CHESS_SETTLEMENT]: '结算阶段',
      [SimpleGameState.PROPOSAL_INIT]: '初始化积分',
      [SimpleGameState.PROPOSAL_ORDER]: '设置轮次顺序',
      [SimpleGameState.PROPOSAL_ROUND_1_SUBMIT]: '第一轮提案-提交',
      [SimpleGameState.PROPOSAL_ROUND_1_VOTE]: '第一轮提案-投票',
      [SimpleGameState.PROPOSAL_ROUND_2_SUBMIT]: '第二轮提案-提交',
      [SimpleGameState.PROPOSAL_ROUND_2_DEBATE]: '第二轮提案-辩论',
      [SimpleGameState.PROPOSAL_ROUND_2_SCORE]: '第二轮提案-评分',
      [SimpleGameState.PROPOSAL_ROUND_3_SUBMIT]: '第三轮提案-提交',
      [SimpleGameState.PROPOSAL_ROUND_3_VOTE]: '第三轮提案-投票',
      [SimpleGameState.PROPOSAL_KNOCKOUT]: '淘汰赛',
      [SimpleGameState.GAME_FINISHED]: '游戏结束',
    }
    return currentState.value ? descriptions[currentState.value] : '未知状态'
  })

  return {
    // 当前状态
    currentState,
    stateDescription,

    // 阶段判断
    isChessPhase,
    isProposalPhase,
    isFinished,

    // 具体状态
    isUploadGrade,
    isUploadLand,
    isMoving,
    isSettlement,
    isProposalInit,
    isProposalOrder,
    isRound1Submit,
    isRound1Vote,
    isRound2Submit,
    isRound2Debate,
    isRound2Score,
    isRound3Submit,
    isRound3Vote,
    isKnockout,

    // 轮次信息
    currentRound,
    proposalStage,
  }
}
