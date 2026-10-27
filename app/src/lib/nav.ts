import { router, type Href } from 'expo-router';

/** Xoá ngăn xếp rồi mở `href` — không vuốt lùi về màn thiết lập được nữa. */
export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}
