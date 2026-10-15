import {
    Queue
} from 'bullmq'

import redisConnection from '../config/redis.js'

const productSyncQueue = new Queue("product-sync", {

    connection:redisConnection

})

export default productSyncQueue;