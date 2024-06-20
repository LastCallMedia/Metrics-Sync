Metrics Sync
============

Metrics Sync is brought to you by your friends at [Last Call Media](https://www.lastcallmedia.com), this tool is designed to consume aggregate metrics from several different cloud providers into a single Elasticsearch instance for graphing and measurement.

Configuration
-------------

This tool is configured through a `sync.yml` file that lives in the working directory.  See [sync.yml.example](./sync.example.yml) for more information.

Running
-------

To invoke a sync, run `bin/metricsync`.  The tool will go out and fetch the latest metrics, and push them into Elasticsearch.  It doesn't particularly matter how often you run the sync - all sources generate an ID that will prevent the records from being duplicated in Elasticsearch.

Alternatively, you can run this application with Docker:
```bash
docker run -v ./sync.yml:/app/sync.yml lastcallmedia/metrics-sync 
```

Sources
--------

#### CircleCI

The CircleCI source consumes job information from the CircleCI APIs.  Specifically, it requests the last N builds and pushes them into an Elasticsearch index.

#### Acquia

The Acquia source consumes some of the Stack Metrics data that Acquia's APIs provide. It aggregates them into hourly chunks, and pushes them into an Elasticsearch index.

#### New Relic

The New Relic source consumes hourly aggregates for the HTTPDispatcher metrics on New Relic.

Credits
-------

This project is an independent effort of Last Call Media, but it was born out of a high-level monitoring need discovered while working on the Mass.gov project.
