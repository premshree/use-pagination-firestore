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

## Example Use

This is an example of a "recently added perfumes" section built using [Material UI](https://material-ui.com/)
and [Firestore](https://firebase.google.com/docs/firestore/). You can see it live on the Petrichor homepage [here](https://petrichor.se/), or
[here](https://imgur.com/a/nUrgzaO) is a screencast.

```jsx
import React from 'react';
import Grid from "@material-ui/core/Grid";
import PerfumeCard from "./search/PerfumeCard";
import {usePagination} from "use-pagination-firestore";
import Loading from "./Loading";
import {
    NavigateNext as NavgateNextIcon,
    NavigateBefore as NavigateBeforeIcon
} from '@material-ui/icons';
import {IconButton} from "@material-ui/core";
import firebase from "firebase/app";

const RecentPerfumes = () => {
    const {
        items,
        isLoading,
        isStart,
        isEnd,
        getPrev,
        getNext,
    } = usePagination<Perfume>(
        firebase
            .firestore()
            .collection("/perfumes")
            .orderBy("updated", "desc"),
        {
            limit: 10
        }
    );

    if (isLoading) {
        return <Loading/>;
    }

    return (
        <Grid container>
            <Grid item xs={12}>
                <Grid container justify="flex-end">
                    <Grid item>
                        <IconButton onClick={getPrev} disabled={isStart}>
                            <NavigateBeforeIcon/>
                        </IconButton>
                        <IconButton onClick={getNext} disabled={isEnd}>
                            <NavgateNextIcon/>
                        </IconButton>
                    </Grid>
                </Grid>
            </Grid>
            {items.map((perfume, idx) => {
                return (
                    <Grid item xs={12} sm={12} md={6} lg={6} key={`recent-perfume-${idx}`}>
                        <PerfumeCard perfume={perfume} size="medium"/>
                    </Grid>
                );
            })}
        </Grid>
    );
}

export default RecentPerfumes;
```

You can also change query during runtime. Hook will detect new query and start pagination from the beginning.
Here is an example of controlling query's `limit` and `orderDirection` by React's state:

```jsx
type ORDER_DIRECTION = 'asc' | 'desc';
const DEFAULT_PAGE_SIZE = 10;

const RecentPerfumes = () => {
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [order, setOrder] = useState<ORDER_DIRECTION>('desc');
    const {
        items,
        isLoading,
        isStart,
        isEnd,
        getPrev,
        getNext,
    } = usePagination<Perfume>(
        firebase
            .firestore()
            .collection("/perfumes")
            .orderBy("updated", order),
        {
            limit: pageSize
        }
    );

    if (isLoading) {
        return <Loading/>;
    }

    return (
        <Grid container>
            <Grid item xs={12}>
                <Grid container justify="flex-end">
                    <Grid item>
                        <PageSizeSelect pageSize={pageSize} onChange={setPageSize} />
                        <OrderDirectionSelect order={order} onChange={setOrder} />
                        <IconButton onClick={getPrev} disabled={isStart}>
                            <NavigateBeforeIcon/>
                        </IconButton>
                        <IconButton onClick={getNext} disabled={isEnd}>
                            <NavgateNextIcon/>
                        </IconButton>
                    </Grid>
                </Grid>
            </Grid>
            {items.map((perfume, idx) => {
                return (
                    <Grid item xs={12} sm={12} md={6} lg={6} key={`recent-perfume-${idx}`}>
                        <PerfumeCard perfume={perfume} size="medium"/>
                    </Grid>
                );
            })}
        </Grid>
    );
}
```
## Caveats

Paginating Firestore documents relies on [query cursors](https://firebase.google.com/docs/firestore/query-data/query-cursors). It's not easy to know
ahead of time how many documents exist in a collection. Consequently, if your `document_count % page_size` is `0` you will notice that your last page
is empty – this is because this hook doesn't (currently) look ahead to know if there are any more documents. 