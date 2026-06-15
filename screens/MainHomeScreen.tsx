import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, View, Image, ScrollView, StatusBar, Text, TouchableOpacity, TextInput, FlatList, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { haptics } from '../config/haptics';
import ListingCard from '../components/explore/ListingCard';
import FilterModal from '../components/explore/FilterModal';
import ActiveFilters from '../components/explore/ActiveFilters';
import { DEFAULT_FILTERS, PRICE_CAP } from '../components/explore/filters';
import FadeInView from '../components/ui/FadeInView';
import ContainerTransform from '../components/ui/ContainerTransform';
import PressableScale from '../components/ui/PressableScale';
import { SkeletonFeedSection } from '../components/ui/Skeleton';
import MessagesListScreen from './MessagesListScreen';
import ItemDetailsScreen from './ItemDetailsScreen';
import ChatScreen from './ChatScreen';
import CreateListingScreen from './CreateListingScreen';
import ProfileScreen from './ProfileScreen';
import SavedScreen from './SavedScreen';
import SettingsScreen from './SettingsScreen';
import BottomNav from '../components/home/BottomNav';
import { Listing, Origin, ChatParam } from '../config/types';
import { Id } from '../convex/_generated/dataModel';

// Peer destinations that share the persistent bottom nav and stay mounted.
// Everything else (item details, chat, compose, settings) renders as a
// full-screen overlay on top of the active tab.
const TAB_SCREENS = ['home', 'saved', 'messagesList', 'profile'];

type CategoryChip = { category: string; Icon: React.ComponentType<any>; icon: string };

// Always-visible labeled category chips — replaces the old hamburger circle
// that hid icon-only category buttons behind a tap.
const CATEGORY_CHIPS: CategoryChip[] = [
  { category: 'All', Icon: Ionicons, icon: 'grid-outline' },
  { category: 'Books', Icon: Ionicons, icon: 'book-outline' },
  { category: 'Electronics', Icon: Ionicons, icon: 'laptop-outline' },
  { category: 'Furniture', Icon: MaterialCommunityIcons, icon: 'bed-outline' },
  { category: 'Clothing', Icon: Ionicons, icon: 'shirt-outline' },
  { category: 'Appliances', Icon: MaterialCommunityIcons, icon: 'fridge-outline' },
  { category: 'Other', Icon: Ionicons, icon: 'cube-outline' },
];

type Props = {
  firstName?: string;
  onLogout: () => void;
  userId?: Id<'users'>;
};

export default function MainHomeScreen({ firstName, onLogout, userId }: Props) {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Header avatar mirrors the profile photo
  const me = useQuery(api.users.current);

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedItem, setSelectedItem] = useState<Listing | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatParam | null>(null);

  // How the active overlay should animate, and (for 'expand') the on-screen
  // rect of the element it was launched from so it can grow out of / collapse
  // back into it. Kept in state so the mounted overlay reads a stable config.
  const [overlayType, setOverlayType] = useState('none');
  const [overlayOrigin, setOverlayOrigin] = useState<Origin | null>(null);

  // Overlay close is two-phase so the exit animation can play: a back press
  // flips `overlayClosing`, ContainerTransform runs the reverse animation, then
  // its onClosed fires the queued navigation that actually unmounts it.
  const [overlayClosing, setOverlayClosing] = useState(false);
  const pendingClose = useRef<(() => void) | null>(null);
  const requestCloseOverlay = (after: () => void) => {
    if (pendingClose.current) return; // already collapsing
    pendingClose.current = after;
    setOverlayClosing(true);
  };
  const handleOverlayClosed = () => {
    const after = pendingClose.current;
    pendingClose.current = null;
    setOverlayClosing(false);
    if (after) after();
  };

  const go = (screen: string, transition = 'none', origin: Origin | null = null) => {
    setOverlayType(transition);
    setOverlayOrigin(origin);
    setCurrentScreen(screen);
  };

  // Remembers the last tab so the shell keeps showing it underneath while an
  // overlay (item details, chat, compose) is open on top.
  const lastTabRef = useRef('home');

  // Which screen item details was opened from, so back returns there
  // (home, saved, or profile) instead of always landing on home.
  const [detailsSource, setDetailsSource] = useState('home');

  // Debounced server-side search — the feed query uses the full-text index
  // on listing titles, so results aren't limited to the first 50 rows.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);
  const isSearching = debouncedSearch.length > 0;

  // Reactive listings — Convex pushes updates, so there's no fetch, no
  // realtime subscription to manage, and no pull-to-refresh needed.
  const feed = useQuery(api.listings.feed, {
    limit: 50,
    search: isSearching ? debouncedSearch : undefined,
  });
  const trendingItems = useQuery(api.listings.trending, { limit: 10 });

  // Saved listing IDs drive the heart state on every card; the Set makes the
  // per-card lookup O(1). toggleSave flips a listing's saved state.
  const savedIds = useQuery(api.saved.savedIds);
  const savedSet = useMemo(() => new Set(savedIds ?? []), [savedIds]);
  const toggleSave = useMutation(api.saved.toggleSave);
  const handleToggleSave = (listingId: Id<'listings'>) => {
    toggleSave({ listingId });
  };

  const isLoading = feed === undefined || trendingItems === undefined;
  const forYouItems = feed ?? [];
  const recentItems = useMemo(() => (feed ?? []).slice(0, 10), [feed]);

  const activeFilterCount = [
    filters.category !== 'All',
    filters.condition !== 'All',
    filters.minPrice > 0 || filters.maxPrice < PRICE_CAP,
  ].filter(Boolean).length;

  // Category selection is already visible in the chips row, so the active
  // filters strip only needs to surface condition/price.
  const modalFilterCount = [
    filters.condition !== 'All',
    filters.minPrice > 0 || filters.maxPrice < PRICE_CAP,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };
  
  // Chips toggle: tapping the selected category deselects back to All
  const handleCategoryFilterPress = (category: string) => {
    haptics.tap();
    setFilters({
      ...filters,
      category: filters.category === category ? 'All' : category,
    });
  };
  
  // Filter function to apply filters to items
  const filterItems = (items: Listing[]) => {
    return items.filter(item => {
      // Category filter
      if (filters.category !== 'All' && item.category !== filters.category) {
        return false;
      }
      
      // Condition filter
      if (filters.condition !== 'All' && item.condition !== filters.condition) {
        return false;
      }
      
      // Price range filter (maxPrice at the cap means "no upper limit")
      if (item.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice < PRICE_CAP && item.price > filters.maxPrice) {
        return false;
      }

      return true;
    });
  };

  // Apply filters to each section using useMemo for performance
  // (text search happens server-side in the feed query)
  const filteredForYou = useMemo(() => filterItems(forYouItems), [filters, forYouItems]);
  const filteredTrending = useMemo(() => filterItems(trendingItems ?? []), [filters, trendingItems]);
  const filteredRecentlyListed = useMemo(() => filterItems(recentItems), [filters, recentItems]);
  
  // Navigation handlers
  const handleItemPress = (item: Listing, origin: Origin | null = null) => {
    // Opening details from details (similar items) keeps the original source
    if (currentScreen !== 'itemDetails') {
      setDetailsSource(currentScreen);
    }
    setSelectedItem(item);
    // Grow the details screen out of the tapped card; fall back to a plain
    // push slide if we couldn't measure the card (e.g. ref unavailable).
    go('itemDetails', origin ? 'expand' : 'push', origin);
  };

  // Back from details collapses into the card, then returns to wherever it was
  // opened from (home, saved, or profile).
  const handleCloseDetails = () => {
    requestCloseOverlay(() => {
      go(detailsSource, 'tab');
      setSelectedItem(null);
      setSelectedChat(null);
    });
  };

  const handleChatWithSeller = (item: Listing) => {
    setSelectedItem(item);
    // Seller summary comes hydrated on every Convex listing
    const sellerName = item.seller
      ? `${item.seller.firstName || ''} ${item.seller.lastName || ''}`.trim() || 'Seller'
      : 'Seller';
    setSelectedChat({
      sellerName,
      itemTitle: item.title,
      sellerId: item.sellerId,
      listingId: item._id,
    });
    // Forward into a fresh thread from the listing — slide in (no row to grow
    // out of here), and on close the listing details is gone, so land home.
    go('chat', 'push');
  };

  const handleChatPress = (chat: ChatParam) => {
    setSelectedChat(chat);
    // Conversations slide in from the right (and back out on return).
    go('chat', 'push');
  };

  // Dismiss an overlay back to the home tab — closing the compose flow, or a
  // chat that was opened straight from a listing (no message list to pop to).
  const returnHome = () => {
    requestCloseOverlay(() => {
      go('home', 'tab');
      setSelectedItem(null);
      setSelectedChat(null);
    });
  };

  const handleBackToMessages = () => {
    requestCloseOverlay(() => {
      go('messagesList', 'tab');
      setSelectedChat(null);
    });
  };

  const handleSellPress = () => {
    haptics.press();
    go('createListing', 'modal');
  };

  const handleProfilePress = () => {
    go('profile');
  };

  const handleEditListing = (listing: Listing) => {
    setSelectedItem(listing);
    go('editListing', 'modal');
  };

  const handleBackToProfile = () => {
    // Dismissing the edit-listing modal: slide it back down, profile reappears.
    requestCloseOverlay(() => {
      go('profile', 'tab');
      setSelectedItem(null);
    });
  };

  const handleOpenSettings = () => {
    // Settings slides in from the right over the profile tab.
    go('settings', 'push');
  };

  const handleBackFromSettings = () => {
    requestCloseOverlay(() => {
      go('profile', 'tab');
    });
  };

  const handleListingCreated = () => {
    // Dismissing the sell modal — the reactive feed picks up the new listing
    returnHome();
  };
  
  // Tab peers (home, saved, messages, profile) share one persistent bottom
  // nav and stay mounted, so switching between them is instant — no remount,
  // no skeleton re-flash, no lost scroll. Drill-ins and compose flows render
  // as overlays *on top* of the shell (covering the nav).
  const isTab = TAB_SCREENS.includes(currentScreen);
  if (isTab) lastTabRef.current = currentScreen;
  const activeTab = isTab ? currentScreen : lastTabRef.current;

  // The active overlay, slid in over the live tab shell. Opening animates
  // (push from the right / modal up); closing just unmounts to reveal the
  // tab already sitting underneath — no background flash, nothing to remount.
  let overlay = null;
  if (currentScreen === 'itemDetails' && selectedItem) {
    overlay = (
      <ContainerTransform
        key="itemDetails"
        type={overlayType}
        origin={overlayOrigin}
        closing={overlayClosing}
        onClosed={handleOverlayClosed}
        style={styles.overlay}
      >
        <ItemDetailsScreen
          item={selectedItem}
          onBack={handleCloseDetails}
          onChatWithSeller={handleChatWithSeller}
          onItemPress={handleItemPress}
          onEditListing={handleEditListing}
        />
      </ContainerTransform>
    );
  } else if (currentScreen === 'chat') {
    overlay = (
      <ContainerTransform
        key="chat"
        type={overlayType}
        origin={overlayOrigin}
        closing={overlayClosing}
        onClosed={handleOverlayClosed}
        style={styles.overlay}
      >
        <ChatScreen
          chat={selectedChat}
          item={selectedItem}
          onBack={selectedItem ? returnHome : handleBackToMessages}
        />
      </ContainerTransform>
    );
  } else if (currentScreen === 'createListing') {
    overlay = (
      <ContainerTransform
        key="createListing"
        type={overlayType}
        closing={overlayClosing}
        onClosed={handleOverlayClosed}
        style={styles.overlay}
      >
        <CreateListingScreen
          onBack={returnHome}
          onSuccess={handleListingCreated}
        />
      </ContainerTransform>
    );
  } else if (currentScreen === 'editListing' && selectedItem) {
    overlay = (
      <ContainerTransform
        key="editListing"
        type={overlayType}
        closing={overlayClosing}
        onClosed={handleOverlayClosed}
        style={styles.overlay}
      >
        <CreateListingScreen
          listing={selectedItem}
          onBack={handleBackToProfile}
          onSuccess={handleBackToProfile}
        />
      </ContainerTransform>
    );
  } else if (currentScreen === 'settings') {
    overlay = (
      <ContainerTransform
        key="settings"
        type={overlayType}
        closing={overlayClosing}
        onClosed={handleOverlayClosed}
        style={styles.overlay}
      >
        <SettingsScreen onBack={handleBackFromSettings} onLogout={onLogout} />
      </ContainerTransform>
    );
  }

  // One card in a horizontal feed row. Own listings can't be saved, so they
  // get no heart (undefined onToggleSave hides it).
  const renderListingCard = ({ item }: { item: Listing }) => (
    <View style={styles.horizontalCard}>
      <ListingCard
        listing={item}
        onPress={(origin) => handleItemPress(item, origin)}
        isSaved={savedSet.has(item._id)}
        onToggleSave={
          item.sellerId === userId ? undefined : () => handleToggleSave(item._id)
        }
      />
    </View>
  );

  // A titled horizontal feed row. Renders nothing when the section is empty,
  // so callers don't repeat the length guard.
  const renderFeedSection = (title: string, data: Listing[], delay = 0) => {
    if (data.length === 0) return null;
    return (
      <FadeInView style={styles.section} delay={delay}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          renderItem={renderListingCard}
          contentContainerStyle={styles.horizontalList}
        />
      </FadeInView>
    );
  };

  const renderHome = () => (
    <View style={styles.container}>
      {/* Purple header: greeting + avatar, then search with built-in filter */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{firstName || me?.firstName || 'Student'}</Text>
          </View>
          <PressableScale
            style={styles.avatarButton}
            scaleTo={0.92}
            onPress={handleProfilePress}
            accessibilityLabel="Open profile"
          >
            {me?.avatarUrl ? (
              <Image source={{ uri: me.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={20} color="#502E82" />
            )}
          </PressableScale>
        </View>

        {/* One search unit: text field + divider + filter entry. The filter
            lives inside the bar so there's a single, unmistakable control. */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9B91A8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, furniture, tech..."
            placeholderTextColor="#9B91A8"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <Pressable
              onPress={() => setSearchText('')}
              hitSlop={8}
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color="#C4BCD1" />
            </Pressable>
          )}
          <View style={styles.searchDivider} />
          <Pressable
            style={styles.filterEntry}
            onPress={() => setShowFilters(true)}
            hitSlop={8}
            accessibilityLabel="Open filters"
          >
            <Ionicons name="options-outline" size={22} color="#502E82" />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Category chips — always visible, labeled, selected state filled */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORY_CHIPS.map(({ category, Icon, icon }) => {
            const selected = filters.category === category;
            return (
              <PressableScale
                key={category}
                scaleTo={0.95}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => handleCategoryFilterPress(category)}
                accessibilityLabel={`Filter by ${category}`}
                accessibilityState={{ selected }}
              >
                <Icon name={icon} size={16} color={selected ? '#FFFFFF' : '#502E82'} />
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {category}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      {/* Active condition/price filters (category state lives in the chips) */}
      {modalFilterCount > 0 && (
        <View style={styles.activeFiltersRow}>
          <ActiveFilters
            filters={filters}
            onUpdateFilters={setFilters}
            onResetFilters={resetFilters}
            hideCategory
          />
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State — skeleton sections preview the feed layout */}
        {isLoading ? (
          <View>
            <SkeletonFeedSection style={styles.section} />
            <SkeletonFeedSection style={styles.section} />
          </View>
        ) : (
          <>
            {/* For You doubles as the search results list */}
            {renderFeedSection(isSearching ? 'Results' : 'For You', filteredForYou)}
            {!isSearching && renderFeedSection('Trending', filteredTrending, 80)}
            {!isSearching && renderFeedSection('Recently Listed', filteredRecentlyListed, 160)}

        {/* No results message */}
        {filteredForYou.length === 0 && (isSearching || (filteredTrending.length === 0 && filteredRecentlyListed.length === 0)) && (
          <FadeInView style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={64} color="#999999" />
            <Text style={styles.noResultsText}>No items found</Text>
            <Text style={styles.noResultsSubtext}>
              {!isSearching && forYouItems.length === 0 && trendingItems.length === 0 && recentItems.length === 0
                ? 'Be the first to list an item!'
                : 'Try adjusting your filters or search terms'}
            </Text>
            {!isSearching && forYouItems.length === 0 && trendingItems.length === 0 && recentItems.length === 0 && (
              <PressableScale style={styles.createFirstButton} onPress={handleSellPress}>
                <Text style={styles.createFirstButtonText}>Create Listing</Text>
              </PressableScale>
            )}
          </FadeInView>
        )}
          </>
        )}
      </ScrollView>
      
      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        filters={filters}
        onClose={() => setShowFilters(false)}
        onUpdateFilters={setFilters}
        onResetFilters={resetFilters}
      />
    </View>
  );

  return (
    <View style={styles.shell}>
      {/* Every tab has the purple header and item details now has a dark image
          scrim, so white status-bar icons read everywhere. The compose flow
          (white screen) sets its own dark-content bar while mounted. */}
      <StatusBar barStyle="light-content" />

      {/* All four tab pages stay mounted; only the active one is visible, so
          switching tabs is instant and keeps state, scroll, and live data. */}
      <View style={styles.tabBody}>
        <View style={[styles.tabPage, activeTab !== 'home' && styles.tabPageHidden]}>
          {renderHome()}
        </View>
        <View style={[styles.tabPage, activeTab !== 'saved' && styles.tabPageHidden]}>
          <SavedScreen embedded onItemPress={handleItemPress} />
        </View>
        <View style={[styles.tabPage, activeTab !== 'messagesList' && styles.tabPageHidden]}>
          <MessagesListScreen embedded onBack={returnHome} onChatPress={handleChatPress} />
        </View>
        <View style={[styles.tabPage, activeTab !== 'profile' && styles.tabPageHidden]}>
          <ProfileScreen
            embedded
            onItemPress={handleItemPress}
            onEditListing={handleEditListing}
            onOpenSettings={handleOpenSettings}
          />
        </View>
      </View>

      {/* Persistent bottom navigation — stays put across every tab */}
      <BottomNav activeTab={activeTab} onNavigate={go} onSell={handleSellPress} />

      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FA',
  },
  screenWrap: {
    flex: 1,
  },
  // Persistent shell: tab body stacked above the always-visible bottom nav.
  shell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabBody: {
    flex: 1,
  },
  tabPage: {
    flex: 1,
  },
  tabPageHidden: {
    display: 'none',
  },
  // Drill-ins / compose flows cover the whole shell, nav included.
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    backgroundColor: '#502E82',
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#D8CCEC',
  },
  nameText: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
    marginTop: -2,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 6,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#1F1B29',
    paddingVertical: 0,
  },
  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8E3F1',
    marginHorizontal: 10,
  },
  filterEntry: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3EAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#502E82',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  chipsWrap: {
    marginTop: 16,
  },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 38,
    borderWidth: 1,
    borderColor: '#E8E3F1',
  },
  chipSelected: {
    backgroundColor: '#502E82',
    borderColor: '#502E82',
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#4A4458',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  activeFiltersRow: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
  },
  horizontalList: {
    paddingHorizontal: 12,
  },
  horizontalCard: {
    width: 160,
    marginHorizontal: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333333',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  createFirstButton: {
    marginTop: 20,
    backgroundColor: '#502E82',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createFirstButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
