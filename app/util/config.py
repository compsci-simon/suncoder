import mysql.connector
import pymysql

MEM_LIMIT = '128m'
TIME_LIMIT = 2
languages = {
    "Python": {
        "extension": ".py",
        "image": "app-engine",
    },
    "Yaml": {
        "extension": ".yaml",
    }
}
