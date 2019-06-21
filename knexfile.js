// Update with your config settings.

const { paths } = require('./lib/util/core');

module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: paths.root.at('gdrive.db').s
    },
    useNullAsDefault: true,
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  staging: {
    client: 'sqlite3',
    connection: {
      filename: paths.root.at('gdrive.db').s
    },
    useNullAsDefault: true,
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: paths.user.at('gdrive.db').s
    },
    useNullAsDefault: true,
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
