const fs = require('fs');
const vm = require('vm');
const path = require('path');

function loadIndexScript() {
  const indexPath = path.join(__dirname, '..', 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  const scriptText = html.substring(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));

  const context = {
    console,
    document: { addEventListener: () => {} },
    localStorage: { getItem: () => null, setItem: () => {} },
    window: {}
  };

  vm.createContext(context);
  vm.runInContext(scriptText, context);

  context.setState = (newState) => {
    vm.runInContext(`
      state = ${JSON.stringify(newState)};
    `, context);
  };

  return context;
}

module.exports = { loadIndexScript };
