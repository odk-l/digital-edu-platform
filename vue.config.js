const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,

  // 开发服务器配置
  devServer: {
    // 修复 WebSocket 连接问题
    client: {
      webSocketURL: "auto://0.0.0.0:0/ws",
    },
  },
});
