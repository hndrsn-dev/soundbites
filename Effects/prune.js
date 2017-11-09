// keep N-day worth of data
days=30;

// change to false to have the script to really exclude old records
// from the database. While true, no change at all will be made to the DB
dryrun=false;

use ace;
// db = connect("127.0.0.1:27117/ace");

collectionNames = db.getCollectionNames();
for (i=0; i<collectionNames.length; i++) {
        name = collectionNames[i];
        query = null;

        if (name.indexOf('stat')==0 || name.indexOf('event')==0 || name.indexOf('alarm')==0) {
                query = {time: {$lt:new Date().getTime()-days*86400*1000}};
        }

        if (name.indexOf('stat_life')==0 || name.indexOf('rogue')==0 || name.indexOf('cache_login')==0) {
                query = {last_seen: { $lt:(new Date().getTime()/1000)-days*86400}};
        }

        if (name.indexOf('session')==0) {
                query = {assoc_time: { $lt:(new Date().getTime()/1000)-days*86400}};
        }

        // removes vouchers expired more than '$days' ago
        // active and unused vouchers are NOT touched
        if (name.indexOf('voucher')==0) {
                query = {end_time: { $lt:(new Date().getTime()/1000)-(days*86400)}};
        }

        if (name.indexOf('guest')==0) {
                query = {end: { $lt:(new Date().getTime()/1000)-days*86400}};
        }

        if (name.indexOf('cache_stat')==0) {
                query = {timestamp: { $lt:(new Date().getTime()/1000)-days*86400}};
        }

        // if an user was only seen ONCE, $last_seen will not be defined
        // so, if $last_seen not defined, lets use $first_seen instead
        // also check if $blocked is set. If true, do NOT purge the entry
        // no matter how old it is. We want blocked users to continue blocked
        if (name.indexOf('user')==0) {
                query = { blocked: { $ne: true}, $or: [
                             {last_seen: { $lt:(new Date().getTime()/1000)-days*86400}},
                             {last_seen: { $exists: false }, first_seen: { $lt:(new Date().getTime()/1000)-days*86400}}
                               ]
                        };
        }

        if (query) {
                count1 = db.getCollection(name).count();
                count2 = db.getCollection(name).find(query).count();
                print((dryrun ? "[dryrun] " : "") + "pruning " + count2 + " entries (total " + count1 + ") from " + name + "... ");
                if (!dryrun)
                        db.getCollection(name).remove(query);
        }
}

if (!dryrun) db.repairDatabase();
