// 导入相关依赖
const vscode = require("vscode")
const path = require("path")
const { writeFileSync } = require("fs")
const { homedir } = require("os")

const P_TITLE = 'Polacode 📸'

// 构建存放图片的路径
let filename = new Date().getTime()
let lastUsedImageUri = vscode.Uri.file(path.resolve(homedir(), "Desktop/" + filename + ".png"))

let shouldCopyEverything = false

// 将序列化的Blob对象转存为File
const writeSerializedBlobToFile = (serializeBlob, fileName) => {
  const bytes = new Uint8Array(serializeBlob.split(","))
  writeFileSync(fileName, Buffer.from(bytes))
}

// 激活功能
function activate(context) {
  let panel
  const panelHandlers = () =>
    // 接收到消息处理函数
    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case "polacode.shoot":
            vscode.window
              .showSaveDialog({
                defaultUri: lastUsedImageUri,
                filters: {
                  Images: ["png"],
                },
              })
              .then(uri => {
                if (uri) {
                  // 输出图片文件
                  writeSerializedBlobToFile(message.data, uri.fsPath)
                  lastUsedImageUri = uri
                }
              })
            return

          case "polacode._onmessage":
            if (message.data.type === "updateBgColor") {
              context.globalState.update("polacode.bgColor", message.data.data.bgColor)
            } else if (message.data.type === "invalidPasteContent") {
              vscode.window.showInformationMessage("Pasted content is invalid. Only copy from VS Code and check if your shortcuts for copy/paste have conflicts.")
            }
            return
        }
      },
      undefined,
      context.subscriptions
    )

  // 注册命令与package.json中对应
  vscode.commands.registerCommand("polacode.activate", () => {
    shouldCopyEverything = true
    // 创建webview面板
    panel = vscode.window.createWebviewPanel("polaCode", P_TITLE, vscode.ViewColumn.Two, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "webview"))],
    })

    // 注册消费者
    panelHandlers()

    const dom2imageJSPath = vscode.Uri.file(path.join(context.extensionPath, "webview", "dom2image.js"))
    const dom2imageJS = dom2imageJSPath.with({ scheme: "vscode-resource" })

    const vivusJSPath = vscode.Uri.file(path.join(context.extensionPath, "webview", "vivus.js"))
    const vivusJS = vivusJSPath.with({ scheme: "vscode-resource" })

    const indexJSPath = vscode.Uri.file(path.join(context.extensionPath, "webview", "index.js"))
    const indexJS = indexJSPath.with({ scheme: "vscode-resource" })

    const fontFamily = vscode.workspace.getConfiguration("editor").fontFamily
    const bgColor = context.globalState.get("polacode.bgColor", "#2e3440")

    panel.webview.html = getHTML(indexJS, vivusJS, dom2imageJS)

    panel.webview.postMessage({
      type: "init",
      fontFamily,
      bgColor,
    })

    panel.onDidDispose(
      () => {
        shouldCopyEverything = false
      },
      null,
      context.subscriptions
    )
  })

  vscode.window.onDidChangeTextEditorSelection(e => {
    if (e.selections[0] && !e.selections[0].isEmpty && shouldCopyEverything) {
      vscode.commands.executeCommand("editor.action.clipboardCopyWithSyntaxHighlightingAction")
      panel.webview.postMessage({ type: "update" })
    }
  })
}

function getHTML(indexJS, vivusJS, dom2imageJS) {
  return `<html><head><style>html{box-sizing:border-box;padding-top:32px}#snippet-container{background-color:transparent;padding:22px;border-radius:4px;transition:opacity 0.4s}#snippet{display:flex;padding:18px;padding-top:38px;padding-bottom:22px;border-radius:5px;box-shadow:rgba(0,0,0,0.55)0px 20px 68px}.snippet--no-shadows{box-shadow:none!important}#snippet>div>div{display:flex;flex-wrap:wrap}#save-container{margin-top:40px;margin-bottom:60px;text-align:center}.obturateur{width:64px;height:64px}.obturateur*{transition:stroke 0.4s}.obturateur:not(.filling)path{opacity:0.5}.options-container{margin-bottom:20px;display:flex;font-size:1em;align-items:center}.options-title{padding:0 1em 0 2em}.options{display:flex;align-items:stretch;border-right:none;user-select:none}.option{align-self:stretch;margin:0.5em}.option__label{display:block;position:relative;transition:all 0.15s ease-out;cursor:pointer;padding:0.5em 1em;border-color:gray;border:1px solid}.option>input[type=checkbox]{z-index:-10;position:absolute;opacity:0}.option>input[type=text]{margin-left:5px}.option:nth-child(3){display:flex;align-items:center}input:checked+.option__label{background-color:rgba(65,105,225,1);border-color:rgb(57,93,199);color:#fff}.boy-box{position:relative;margin-top:64px;margin-bottom:64px}.window-controls{position:absolute;top:8px;left:8px}</style></head><body><div class="options-container"><div class="options-title">Options</div><div class="options"><div class="option"><input type="checkbox"name="optShadows"id="optShadows"checked><label for="optShadows"class="option__label">Shadow</label></div><div class="option"><input type="checkbox"name="optTransparent"id="optTransparent"checked><label for="optTransparent"class="option__label">Transparent</label></div><div class="option"><label for="optColor">Color</label><input type="text"name="optColor"id="optColor"placeholder="color"value="#f2f2f2"></div></div></div><div id="snippet-container"><div class="boy-box"><div id="control"class="window-controls"><svg xmlns="http://www.w3.org/2000/svg"width="54"height="14"viewBox="0 0 54 14"><g fill="none"fill-rule="evenodd"transform="translate(1 1)"><circle cx="6"cy="6"r="6"fill="#FF5F56"stroke="#E0443E"stroke-width=".5"></circle><circle cx="26"cy="6"r="6"fill="#FFBD2E"stroke="#DEA123"stroke-width=".5"></circle><circle cx="46"cy="6"r="6"fill="#27C93F"stroke="#1AAB29"stroke-width=".5"></circle></g></svg></div><div id="snippet"style="color: #d8dee9;background-color: #2e3440;font-family: SFMono-Regular,Consolas,DejaVu Sans Mono,Ubuntu Mono,Liberation Mono,Menlo,Courier,monospace;font-weight: normal;font-size: 12px;line-height: 18px;white-space: pre;"><meta charset="utf-8"/><div style="color: #d8dee9;background-color: #2e3440;font-family: Input Mono;font-weight: normal;font-size: 12px;line-height: 18px;white-space: pre;"><div><span style="color: #8fbcbb;">console</span><span style="color: #eceff4;">.</span><span style="color: #88c0d0;">log</span><span style="color: #d8dee9;">(</span><span style="color: #eceff4;">'</span><span style="color: #a3be8c;">0. Run command \`Polacode ?��
                          \`</span><span style="color: #eceff4;">'</span><span style="color: #d8dee9;">)</span></div><div><span style="color: #8fbcbb;">console</span><span style="color: #eceff4;">.</span><span style="color: #88c0d0;">log</span><span style="color: #d8dee9;">(</span><span style="color: #eceff4;">'</span><span style="color: #a3be8c;">1. Copy some code</span><span
                          style="color: #eceff4;">'</span><span style="color: #d8dee9;">)</span></div><div><span style="color: #8fbcbb;">console</span><span style="color: #eceff4;">.</span><span style="color: #88c0d0;">log</span><span style="color: #d8dee9;">(</span><span style="color: #eceff4;">'</span><span style="color: #a3be8c;">2. Paste into Polacode
                          view</span><span style="color: #eceff4;">'</span><span style="color: #d8dee9;">)</span></div><div><span style="color: #8fbcbb;">console</span><span style="color: #eceff4;">.</span><span style="color: #88c0d0;">log</span><span style="color: #d8dee9;">(</span><span style="color: #eceff4;">'</span><span style="color: #a3be8c;">3. Click the button ?��
                      </span><span style="color: #eceff4;">'</span><span style="color: #d8dee9;">)</span></div></div></div></div></div><div id="save-container"><svg id="save"class="obturateur"width="132px"height="132px"viewBox="0 0 132 132"version="1.1"xmlns="http://www.w3.org/2000/svg"xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Page-1"stroke="none"stroke-width="1"fill="none"fill-rule="evenodd"stroke-linecap="round"stroke-linejoin="round"><g id="obturateur"transform="translate(2.000000, 2.000000)"stroke-width="3"><circle id="Oval"stroke="#4C566A"cx="64"cy="64"r="64"></circle><circle id="Oval"stroke="#4C566A"cx="64"cy="64"r="60.9706667"></circle><circle id="Oval"stroke="#4C566A"cx="64"cy="64"r="51.8734222"></circle><circle id="Oval"stroke="#D8DEE9"cx="64"cy="64"r="28.2595556"></circle><path d="M17.0965333,86.1788444 L40.5667556,48.1998222"id="Shape"stroke="#EBCB8B"></path><path d="M15.1509333,46.5180444 L58.6026667,36.2574222"id="Shape"stroke="#A3BE8C"></path><path d="M41.8204444,17.0965333 L79.8001778,40.5660444"id="Shape"stroke="#8FBCBB"></path><path d="M81.4819556,15.1502222 L91.7425778,58.6019556"id="Shape"stroke="#88C0D0"></path><path d="M110.902756,41.8197333 L87.4332444,79.8001778"id="Shape"stroke="#81A1C1"></path><path d="M112.848356,81.4819556 L69.3973333,91.7418667"id="Shape"stroke="#B48EAD"></path><path d="M86.1795556,110.902756 L48.1998222,87.4332444"id="Shape"stroke="#BF616A"></path><path d="M46.5187556,112.848356 L36.2574222,69.3973333"id="Shape"stroke="#D08770"></path></g></g></svg></div><script src="${dom2imageJS}"></script><script src="${vivusJS}"></script><script src="${indexJS}"></script></body></html>`
}

exports.activate = activate
