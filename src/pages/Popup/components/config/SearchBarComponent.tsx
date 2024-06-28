import React from 'react';
import { IPrebidDetails } from '../../../Injected/prebid';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import { styled } from '@mui/material/styles';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import { useTheme } from '@mui/material';
const LISTBOX_PADDING = 8; // px

const SearchBarComponent = ({ config }: SearchBarComponentProps): JSX.Element => {
  const options = new Set<string>();
  const loop = (obj: any) => {
    for (var k in obj) {
      if (typeof obj[k] == 'object' && obj[k] !== null) {
        loop(obj[k]);
      } else {
        if (!k.startsWith('_') && typeof k === 'string') {
          options.add(k);
        }
        if (!k.startsWith('_') && typeof obj[k] === 'string') {
          options.add(obj[k]);
        }
      }
    }
  };
  loop(config);
  return (
    <Grid item xs={12}>
      <Autocomplete
        sx={{ w: 1 }}
        disableListWrap
        PopperComponent={StyledPopper}
        ListboxComponent={ListboxComponent}
        options={Array.from(options).sort()}
        groupBy={(option) => option[0].toUpperCase()}
        renderInput={(params) => <TextField {...params} label="search" sx={{ backgroundColor: 'background.paper', borderRadius: 1 }} />}
        renderOption={(props, option) => [props, option]}
        renderGroup={(params) => params}
      />
    </Grid>
  );
};

interface SearchBarComponentProps {
  config: IPrebidDetails['config'];
}

export default SearchBarComponent;

const renderRow = (props: ListChildComponentProps) => {
  const { data, index, style } = props;
  const dataSet = data[index];
  const inlineStyle = {
    ...style,
    top: (style.top as number) + LISTBOX_PADDING,
  };

  if (dataSet.hasOwnProperty('group')) {
    return (
      <ListSubheader key={dataSet.key} component="div" style={inlineStyle}>
        {dataSet.group}
      </ListSubheader>
    );
  }

  return (
    <Typography component="li" {...dataSet[0]} noWrap style={inlineStyle}>
      {dataSet[1]}
    </Typography>
  );
};

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef<HTMLDivElement>((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data: any) {
  const ref = React.useRef<VariableSizeList>(null);
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

// Adapter for react-window
const ListboxComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLElement>>(function ListboxComponent(props, ref) {
  const theme = useTheme();
  const { children, ...other } = props;
  const itemData: React.ReactChild[] = [];
  (children as React.ReactChild[]).forEach((item: React.ReactChild & { children?: React.ReactChild[] }) => {
    itemData.push(item);
    itemData.push(...(item.children || []));
  });

  const smUp = useMediaQuery(theme.breakpoints.up('sm'), {
    noSsr: true,
  });
  const itemCount = itemData?.length;
  const itemSize = smUp ? 36 : 48;

  const getChildSize = (child: React.ReactChild) => {
    if (child.hasOwnProperty('group')) {
      return 48;
    }

    return itemSize;
  };

  const getHeight = () => {
    if (itemCount > 8) {
      return 8 * itemSize;
    }
    return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
  };

  const gridRef = useResetCache(itemCount);

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={itemData}
          height={getHeight() + 2 * LISTBOX_PADDING}
          width="100%"
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={(index) => getChildSize(itemData[index])}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

const StyledPopper = styled(Popper)({
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: 'border-box',
    '& ul': {
      padding: 0,
      margin: 0,
    },
  },
});
