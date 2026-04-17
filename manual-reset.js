// 手动重置脚本
// 在浏览器控制台运行这个脚本来强制重置所有数据

console.log('=== 开始手动重置 ===')

// 1. 清除所有 localStorage
console.log('1. 清除 localStorage...')
localStorage.clear()
console.log('   ✓ localStorage 已清除')

// 2. 清除所有 sessionStorage
console.log('2. 清除 sessionStorage...')
sessionStorage.clear()
console.log('   ✓ sessionStorage 已清除')

// 3. 刷新页面
console.log('3. 刷新页面...')
setTimeout(() => {
  window.location.reload()
}, 1000)

console.log('=== 1秒后将刷新页面 ===')
