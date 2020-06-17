# use-pagination-firestore

A React Hook that makes it easy to paginate firestore collections.
This hook is similar, but the not the same as
[firestore-pagination-hook](https://github.com/bmcmahen/firestore-pagination-hook). This hook
provides _non cumulative_ pagination and does _not_ maintain references to previous
documents, so it might be suitable for large document sets.

## Install

```
npm install use-pagination-firestore
```