const url = 'https://cms.energdive.com/api/issues?populate=CoverImage&t=' + Date.now();
fetch(url).then(res => res.json()).then(json => {
  const formatted = json.data.map(item => {
    const dataObj = item.attributes || item;
    const month = dataObj.Month || dataObj.month || item.Month || item.month || '';
    const year = dataObj.Year || dataObj.year || item.Year || item.year || '';
    return {
      title: dataObj.Title || dataObj.title,
      month: String(month),
      year: String(year),
      isCurrentIssue: !!(dataObj.is_current_issue || item.is_current_issue),
      rawIsCurrent: dataObj.is_current_issue
    };
  });
  console.log('UNSORTED:\n', JSON.stringify(formatted, null, 2));
  
  const monthOrder = {
      january: 1, fbruary: 2, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
  };
  
  formatted.sort((a, b) => {
      if (a.isCurrentIssue && !b.isCurrentIssue) return -1;
      if (!a.isCurrentIssue && b.isCurrentIssue) return 1;
      const yearA = parseInt(a.year, 10) || 0;
      const yearB = parseInt(b.year, 10) || 0;
      if (yearA !== yearB) return yearB - yearA;
      const monthA = monthOrder[a.month.toLowerCase()] || 0;
      const monthB = monthOrder[b.month.toLowerCase()] || 0;
      return monthB - monthA;
  });
  console.log('SORTED:\n', JSON.stringify(formatted, null, 2));
}).catch(console.error);
