class Terminal {
    constructor() {
        this.terminalContent = document.getElementById('terminal-content');
        this.commandInput = document.getElementById('command-input');
        this.currentDir = '~';
        this.fileSystem = {
            '~': {
                type: 'directory',
                contents: {
                    'Documents': { type: 'directory', contents: {} },
                    'Downloads': { type: 'directory', contents: {} },
                    'Pictures': { type: 'directory', contents: {} },
                    'Music': { type: 'directory', contents: {} },
                    'Videos': { type: 'directory', contents: {} },
                    'welcome.txt': { 
                        type: 'file', 
                        content: '欢迎使用虚拟Linux终端！\n这是一个示例文件。' 
                    }
                }
            }
        };
        this.currentPath = ['~'];
        this.history = [];  // 命令历史
        this.historyIndex = -1;  // 历史命令索引
        this.setupEventListeners();

        // 添加命令帮助文档
        this.helpDocs = {
            ls: `用法：ls [目录]
描述：列出目录内容
选项：
  无选项     列出当前目录的内容
  [目录]     列出指定目录的内容`,

            cd: `用法：cd [目录]
描述：改变当前工作目录
选项：
  无选项     返回主目录
  ..        返回上级目录
  [目录]     进入指定目录`,

            pwd: `用法：pwd
描述：显示当前工作目录的完整路径
选项：无`,

            mkdir: `用法：mkdir [目录名]
描述：创建新目录
选项：
  [目录名]   要创建的目录名称`,

            touch: `用法：touch [文件名]
描述：创建新文件
选项：
  [文件名]   要创建的文件名称`,

            cat: `用法：cat [文件名]
描述：显示文件内容
选项：
  [文件名]   要显示的文件名称`,

            echo: `用法：echo [文本] [> 文件名]
描述：显示文本或将文本写入文件
选项：
  [文本]     要显示的文本
  > [文件名] 将文本写入指定文件`,

            rm: `用法：rm [-r] [文件/目录]
描述：删除文件或目录
选项：
  -r        递归删除目录及其内容
  [文件]     要删除的文件
  [目录]     要删除的目录（需要 -r 选项）`,

            cp: `用法：cp [-r] [源文件] [目标文件]
描述：复制文件或目录
选项：
  -r        递归复制目录
  [源文件]   要复制的源文件或目录
  [目标文件] 目标位置`,

            mv: `用法：mv [源文件] [目标文件]
描述：移动/重命名文件或目录
选项：
  [源文件]   要移动的文件或目录
  [目标文件] 目标位置或新名称`,

            grep: `用法：grep [模式] [文件]
描述：在文件中搜索指定的文本模式
选项：
  [模式]     要搜索的文本模式
  [文件]     要搜索的文件`,

            wc: `用法：wc [文件]
描述：统计文件的行数、字数和字符数
选项：
  [文件]     要统计的文件`,

            find: `用法：find [路径] [模式]
描述：在指定路径下查找文件
选项：
  [路径]     搜索的起始路径（默认为当前目录）
  [模式]     文件名匹配模式（支持 * 通配符）`,

            ps: `用法：ps
描述：显示当前进程状态
选项：无`,

            uname: `用法：uname [-a]
描述：显示系统信息
选项：
  -a        显示所有系统信息`,

            history: `用法：history
描述：显示命令历史记录
选项：无`,

            man: `用法：man [命令]
描述：显示命令的手册页
选项：
  [命令]     要查看手册的命令名称`,

            dd: `用法：dd if=输入文件 of=输出文件 bs=块大小 count=计数
描述：复制文件并转换格式
选项：
  if=文件    指定输入文件
  of=文件    指定输出文件
  bs=大小    指定块大小
  count=数量 指定复制的块数`,

            du: `用法：du [文件/目录]
描述：显示文件或目录的大小
选项：
  [文件/目录] 要统计大小的文件或目录`,

            clear: `用法：clear
描述：清除终端屏幕内容
选项：无`,

            back: `用法：back
描述：返回网站首页
选项：无`,

            help: `用法：help
描述：显示所有可用命令的列表
选项：无

也可以使用：[命令] --help 查看特定命令的帮助信息`
        };
    }

    setupEventListeners() {
        this.commandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.commandInput.value;
                if (command.trim()) {
                    this.history.push(command);
                    this.historyIndex = this.history.length;
                }
                this.executeCommand(command);
                this.commandInput.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.commandInput.value = this.history[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.commandInput.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    this.commandInput.value = '';
                }
            }
        });
    }

    createNewCommandLine() {
        const commandLine = document.createElement('div');
        commandLine.className = 'command-line';
        commandLine.innerHTML = `
            <span class="prompt">guest@linux:${this.currentDir}$</span>
            <span>${this.commandInput.value}</span>
        `;
        this.terminalContent.insertBefore(commandLine, this.commandInput.parentElement);
    }

    addOutput(output) {
        const outputDiv = document.createElement('div');
        outputDiv.className = 'output';
        outputDiv.textContent = output;
        this.terminalContent.insertBefore(outputDiv, this.commandInput.parentElement);
    }

    parseCommand(commandStr) {
        const parts = commandStr.match(/("[^"]+"|'[^']+'|\S+)/g) || [];
        return parts.map(part => part.replace(/^["']|["']$/g, ''));
    }

    getCurrentDirectory() {
        let current = this.fileSystem;
        for (let dir of this.currentPath) {
            current = current[dir].contents;
        }
        return current;
    }

    calculateSize(item) {
        if (item.type === 'file') {
            return item.content.length;
        } else {
            let size = 0;
            for (let child of Object.values(item.contents)) {
                size += this.calculateSize(child);
            }
            return size;
        }
    }

    deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    executeCommand(commandStr) {
        const [command, ...args] = this.parseCommand(commandStr);
        
        // 检查是否是帮助请求
        if (args.includes('--help')) {
            if (this.helpDocs[command]) {
                this.createNewCommandLine();
                this.addOutput(this.helpDocs[command]);
                return;
            }
        }

        this.createNewCommandLine();
        
        const commands = {
            'ls': () => {
                const currentDir = this.getCurrentDirectory();
                return Object.keys(currentDir).join('  ');
            },
            'pwd': () => '/' + this.currentPath.join('/').replace(/^~/, 'home/guest'),
            'whoami': () => 'guest',
            'date': () => new Date().toString(),
            'clear': () => {
                this.terminalContent.innerHTML = '';
                this.terminalContent.appendChild(this.commandInput.parentElement);
                return '';
            },
            'echo': (args) => {
                if (args.length >= 2 && args[args.length - 2] === '>') {
                    // 处理文件写入
                    const fileName = args[args.length - 1];
                    const content = args.slice(0, -2).join(' ');
                    const currentDir = this.getCurrentDirectory();
                    
                    if (currentDir[fileName] && currentDir[fileName].type === 'directory') {
                        return `echo: ${fileName}: 是一个目录`;
                    }
                    
                    currentDir[fileName] = {
                        type: 'file',
                        content: content
                    };
                    return '';
                }
                return args.join(' ');
            },
            'cd': (args) => {
                const newDir = args[0] || '~';
                if (newDir === '..') {
                    if (this.currentPath.length > 1) {
                        this.currentPath.pop();
                        return '';
                    }
                    return '已经在根目录';
                }
                
                if (newDir === '~') {
                    this.currentPath = ['~'];
                    return '';
                }

                const currentDir = this.getCurrentDirectory();
                if (currentDir[newDir] && currentDir[newDir].type === 'directory') {
                    this.currentPath.push(newDir);
                    return '';
                }
                return `cd: ${newDir}: 没有该目录`;
            },
            'mkdir': (args) => {
                if (!args[0]) return 'mkdir: 缺少操作数';
                const dirName = args[0];
                const currentDir = this.getCurrentDirectory();
                
                if (currentDir[dirName]) {
                    return `mkdir: 无法创建目录 '${dirName}': 文件已存在`;
                }
                
                currentDir[dirName] = {
                    type: 'directory',
                    contents: {}
                };
                return '';
            },
            'touch': (args) => {
                if (!args[0]) return 'touch: 缺少文件操作数';
                const fileName = args[0];
                const currentDir = this.getCurrentDirectory();
                
                if (currentDir[fileName]) {
                    return `touch: 无法创建文件 '${fileName}': 文件已存在`;
                }
                
                currentDir[fileName] = {
                    type: 'file',
                    content: ''
                };
                return '';
            },
            'cat': (args) => {
                if (!args[0]) return 'cat: 缺少文件操作数';
                const fileName = args[0];
                const currentDir = this.getCurrentDirectory();
                
                if (!currentDir[fileName]) {
                    return `cat: ${fileName}: 没有该文件或目录`;
                }
                
                if (currentDir[fileName].type === 'directory') {
                    return `cat: ${fileName}: 是一个目录`;
                }
                
                return currentDir[fileName].content || '';
            },
            'rm': (args) => {
                if (!args[0]) return 'rm: 缺少操作数';
                const fileName = args[0];
                const currentDir = this.getCurrentDirectory();
                
                if (!currentDir[fileName]) {
                    return `rm: 无法删除 '${fileName}': 没有该文件或目录`;
                }
                
                if (currentDir[fileName].type === 'directory' && !args.includes('-r')) {
                    return `rm: 无法删除 '${fileName}': 是一个目录`;
                }
                
                delete currentDir[fileName];
                return '';
            },
            'cp': (args) => {
                if (args.length < 2) return 'cp: 缺少目标文件操作数';
                const [source, dest] = args;
                const currentDir = this.getCurrentDirectory();
                
                if (!currentDir[source]) {
                    return `cp: 无法获取 '${source}' 的状态: 没有该文件或目录`;
                }
                
                if (currentDir[source].type === 'directory' && !args.includes('-r')) {
                    return `cp: 未指定 -r 选项，不能复制目录 '${source}'`;
                }
                
                currentDir[dest] = this.deepCopy(currentDir[source]);
                return '';
            },
            'dd': (args) => {
                // 简化版的dd命令，只支持生成指定大小的文件
                const options = {};
                args.forEach(arg => {
                    const [key, value] = arg.split('=');
                    options[key] = value;
                });

                if (!options.of) return 'dd: 缺少输出文件参数';
                if (!options.bs || !options.count) return 'dd: 缺少块大小或计数参数';

                const size = parseInt(options.bs) * parseInt(options.count);
                const currentDir = this.getCurrentDirectory();
                
                currentDir[options.of] = {
                    type: 'file',
                    content: '0'.repeat(size)
                };

                return `记录了${options.count}+0 的读入\n记录了${options.count}+0 的写出\n${size}字节已复制`;
            },
            'du': (args) => {
                const target = args[0] || '.';
                const currentDir = this.getCurrentDirectory();
                
                if (target === '.') {
                    const sizes = Object.entries(currentDir).map(([name, item]) => {
                        const size = this.calculateSize(item);
                        return `${size}\t./${name}`;
                    });
                    return sizes.join('\n');
                }
                
                if (!currentDir[target]) {
                    return `du: 无法访问 '${target}': 没有该文件或目录`;
                }
                
                return `${this.calculateSize(currentDir[target])}\t./${target}`;
            },
            'grep': (args) => {
                if (args.length < 2) return 'grep: 缺少搜索模式和文件名';
                
                const pattern = args[0];
                const fileName = args[1];
                const currentDir = this.getCurrentDirectory();
                
                // 检查文件是否存在
                if (!currentDir[fileName]) {
                    return `grep: ${fileName}: 没有该文件或目录`;
                }
                
                // 检查是否是目录
                if (currentDir[fileName].type === 'directory') {
                    return `grep: ${fileName}: 是一个目录`;
                }
                
                // 执行搜索
                try {
                    const content = currentDir[fileName].content;
                    const lines = content.split('\n');
                    const matches = lines
                        .map((line, index) => {
                            if (line.includes(pattern)) {
                                return `${index + 1}:${line}`;
                            }
                            return null;
                        })
                        .filter(line => line !== null);
                    
                    // 如果没有找到匹配项
                    if (matches.length === 0) {
                        return '';
                    }
                    
                    return matches.join('\n');
                } catch (error) {
                    return `grep: 搜索时发生错误: ${error.message}`;
                }
            },
            'wc': (args) => {
                if (!args[0]) return 'wc: 缺少文件名';
                const fileName = args[0];
                const currentDir = this.getCurrentDirectory();
                
                if (!currentDir[fileName]) {
                    return `wc: ${fileName}: 没有该文件或目录`;
                }
                
                if (currentDir[fileName].type === 'directory') {
                    return `wc: ${fileName}: 是一个目录`;
                }
                
                const content = currentDir[fileName].content;
                const lines = content.split('\n').length;
                const words = content.split(/\s+/).filter(Boolean).length;
                const chars = content.length;
                
                return `${lines} ${words} ${chars} ${fileName}`;
            },
            'mv': (args) => {
                if (args.length < 2) return 'mv: 缺少源文件或目标';
                const [source, dest] = args;
                const currentDir = this.getCurrentDirectory();
                
                if (!currentDir[source]) {
                    return `mv: 无法获取 '${source}' 的状态: 没有该文件或目录`;
                }
                
                currentDir[dest] = currentDir[source];
                delete currentDir[source];
                return '';
            },
            'find': (args) => {
                const path = args[0] || '.';
                const pattern = args[1] || '*';
                
                const searchDir = (dir, prefix = '') => {
                    return Object.entries(dir).reduce((acc, [name, item]) => {
                        const fullPath = prefix ? `${prefix}/${name}` : name;
                        if (name.includes(pattern) || pattern === '*') {
                            acc.push(fullPath);
                        }
                        if (item.type === 'directory') {
                            acc.push(...searchDir(item.contents, fullPath));
                        }
                        return acc;
                    }, []);
                };
                
                const currentDir = path === '.' ? this.getCurrentDirectory() : this.fileSystem[path].contents;
                const results = searchDir(currentDir);
                return results.join('\n') || '未找到匹配项';
            },
            'ps': () => {
                return 'PID TTY          TIME CMD\n  1 pts/0    00:00:00 bash\n  2 pts/0    00:00:00 ps';
            },
            'uname': (args) => {
                if (args.includes('-a')) {
                    return 'Linux localhost 5.10.0-virtual #1 SMP x86_64 GNU/Linux';
                }
                return 'Linux';
            },
            'history': () => {
                return this.history.map((cmd, i) => ` ${i + 1}  ${cmd}`).join('\n');
            },
            'man': (args) => {
                if (!args[0]) return 'man: 需要手册页';
                const manPages = {
                    ls: 'LS(1)\n\nNAME\n       ls - 列出目录内容\n\nSYNOPSIS\n       ls [目录]\n\nDESCRIPTION\n       列出指定目录下的文件和子目录。',
                    cd: 'CD(1)\n\nNAME\n       cd - 改变当前工作目录\n\nSYNOPSIS\n       cd [目录]\n\nDESCRIPTION\n       改变当前工作目录到指定目录。',
                    // ... 可以添加更多命令的手册页
                };
                return manPages[args[0]] || `没有 ${args[0]} 的手册页`;
            },
            'help': () => `可用命令：
ls - 列出目录内容
pwd - 显示当前工作目录
cd [目录] - 切换目录
mkdir [目录名] - 创建新目录
touch [文件名] - 创建新文件
cat [文件名] - 显示文件内容
echo [文本] - 显示文本
echo [文本] > [文件名] - 将文本写入文件
rm [-r] [文件/目录] - 删除文件或目录
cp [-r] [源文件] [目标文件] - 复制文件或目录
mv [源文件] [目标文件] - 移动/重命名文件
grep [模式] [文件] - 搜索文件内容
wc [文件] - 统计文件行数、字数和字符数
find [路径] [模式] - 查找文件
ps - 显示进程状态
uname [-a] - 显示系统信息
history - 显示命令历史
man [命令] - 显示命令手册
dd if=输入文件 of=输出文件 bs=块大小 count=计数 - 复制文件并转换格式
du [文件/目录] - 显示文件或目录的大小
clear - 清屏`,
            'back': () => {
                // 添加一个过渡动画
                document.querySelector('.terminal').style.animation = 'fadeOut 0.3s ease-out forwards';
                
                // 等待动画完成后跳转
                setTimeout(() => {
                    window.location.href = '/';
                }, 300);
                
                return '正在返回首页...';
            },
        };

        if (command.trim() === '') return;

        if (commands[command]) {
            const output = commands[command](args);
            if (output) this.addOutput(output);
        } else {
            this.addOutput(`命令未找到: ${command}`);
        }

        this.terminalContent.scrollTop = this.terminalContent.scrollHeight;
        this.currentDir = this.currentPath[this.currentPath.length - 1];
    }
}

new Terminal();
