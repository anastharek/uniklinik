import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ThumbnailList } from '../ThumbnailList';
import { PreloadStudyControl } from '../Thumbnail/PreloadStudyControl';
import { Button } from '../Button';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../Accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';

// Progressive loading: cap the number of series thumbnails rendered initially
// per study. Large studies (e.g. 50+ series) would otherwise render every
// thumbnail at once, causing memory pressure and UI jank. Studies with more
// than this many series get a "Show more series" control.
const MAX_INITIAL_SERIES = 30;

const StudyItem = ({
  date,
  description,
  numInstances,
  modalities,
  isActive,
  onClick,
  isExpanded,
  displaySets,
  activeDisplaySetInstanceUIDs,
  onClickThumbnail,
  onDoubleClickThumbnail,
  onClickUntrack,
  viewPreset = 'thumbnails',
  ThumbnailMenuItems,
  StudyMenuItems,
  StudyInstanceUID,
}: withAppTypes) => {
  const [showAllSeries, setShowAllSeries] = useState(false);

  const visibleDisplaySets = useMemo(() => {
    if (!displaySets || showAllSeries || displaySets.length <= MAX_INITIAL_SERIES) {
      return displaySets;
    }
    return displaySets.slice(0, MAX_INITIAL_SERIES);
  }, [displaySets, showAllSeries]);

  const hiddenSeriesCount = displaySets
    ? displaySets.length - (visibleDisplaySets?.length || 0)
    : 0;

  return (
    <Accordion
      type="single"
      collapsible
      onClick={onClick}
      onKeyDown={() => {}}
      role="button"
      tabIndex={0}
      defaultValue={isActive ? 'study-item' : undefined}
    >
      <AccordionItem value="study-item">
        <AccordionTrigger className={classnames('hover:bg-accent bg-popover group w-full rounded')}>
          <div className="flex h-[40px] w-full flex-row overflow-hidden">
            <div className="flex w-full flex-row items-center justify-between">
              <div className="flex min-w-0 flex-col items-start text-[13px]">
                <Tooltip>
                  <TooltipContent>{date}</TooltipContent>
                  <TooltipTrigger
                    className="w-full"
                    asChild
                  >
                    <div className="text-foreground h-[18px] w-full max-w-[160px] overflow-hidden truncate whitespace-nowrap text-left">
                      {date}
                    </div>
                  </TooltipTrigger>
                </Tooltip>
                <Tooltip>
                  <TooltipContent>{description}</TooltipContent>
                  <TooltipTrigger
                    className="w-full"
                    asChild
                  >
                    <div className="text-muted-foreground h-[18px] w-full overflow-hidden truncate whitespace-nowrap text-left">
                      {description}
                    </div>
                  </TooltipTrigger>
                </Tooltip>
              </div>
              <div className="text-muted-foreground flex flex-col items-end pl-[10px] text-[12px]">
                <div className="max-w-[150px] overflow-hidden text-ellipsis">{modalities}</div>
                <div>{numInstances}</div>
              </div>
              {StudyMenuItems && (
                <div className="ml-2 flex items-center">
                  <StudyMenuItems StudyInstanceUID={StudyInstanceUID} />
                </div>
              )}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent
          onClick={event => {
            event.stopPropagation();
          }}
        >
          {isExpanded && <PreloadStudyControl StudyInstanceUID={StudyInstanceUID} />}
          {isExpanded && visibleDisplaySets && (
            <ThumbnailList
              thumbnails={visibleDisplaySets}
              activeDisplaySetInstanceUIDs={activeDisplaySetInstanceUIDs}
              onThumbnailClick={onClickThumbnail}
              onThumbnailDoubleClick={onDoubleClickThumbnail}
              onClickUntrack={onClickUntrack}
              viewPreset={viewPreset}
              ThumbnailMenuItems={ThumbnailMenuItems}
            />
          )}
          {isExpanded && hiddenSeriesCount > 0 && (
            <Button
              variant="link"
              className="w-full justify-center py-2 text-[12px]"
              onClick={event => {
                event.stopPropagation();
                setShowAllSeries(true);
              }}
            >
              Show more series ({hiddenSeriesCount} more)
            </Button>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

StudyItem.propTypes = {
  date: PropTypes.string.isRequired,
  description: PropTypes.string,
  modalities: PropTypes.string.isRequired,
  numInstances: PropTypes.number.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool,
  displaySets: PropTypes.array,
  activeDisplaySetInstanceUIDs: PropTypes.array,
  onClickThumbnail: PropTypes.func,
  onDoubleClickThumbnail: PropTypes.func,
  onClickUntrack: PropTypes.func,
  viewPreset: PropTypes.string,
  StudyMenuItems: PropTypes.func,
  StudyInstanceUID: PropTypes.string,
};

export { StudyItem };
