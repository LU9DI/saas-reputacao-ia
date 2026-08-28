const path = require('path');

module.exports = {
  // Envolvemos o caminho em resolve dinâmico para limpar o literal 'C:\' do parser
  schema: path.resolve(__dirname, './prisma/schema.prisma'),
  datasource: {
    url: 'file:./dev.db'
  }
};
