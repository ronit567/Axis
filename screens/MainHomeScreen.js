import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, View, Image, ScrollView, StatusBar, Text, TouchableOpacity, TextInput, FlatList, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import ListingCard from '../components/explore/ListingCard';
import FilterModal from '../components/explore/FilterModal';
import ActiveFilters from '../components/explore/ActiveFilters';
import { DEFAULT_FILTERS, PRICE_CAP } from '../components/explore/filters';
import FadeInView from '../components/ui/FadeInView';
import ScreenTransition from '../components/ui/ScreenTransition';
import PressableScale from '../components/ui/PressableScale';
import { SkeletonFeedSection } from '../components/ui/Skeleton';
import MessagesListScreen from './MessagesListScreen';
import ItemDetailsScreen from './ItemDetailsScreen';
import ChatScreen from './ChatScreen';
import CreateListingScreen from './CreateListingScreen';
import ProfileScreen from './ProfileScreen';
import SavedScreen from './SavedScreen';

// Peer destinations that share the persistent bottom nav and stay mounted.
const TAB_SCREENS = ['home', 'saved', 'messagesList', 'profile'];
// Drill-ins / compose flows that render full-screen over the tab shell.
const OVERLAY_SCREENS = ['itemDetails', 'chat', 'createListing', 'editListing'];

// Always-visible labeled category chips — replaces the old hamburger circle
// that hid icon-only category buttons behind a tap.
const CATEGORY_CHIPS = [
  { category: 'All', Icon: Ionicons, icon: 'grid-outline' },
  { category: 'Books', Icon: Ionicons, icon: 'book-outline' },
  { category: 'Electronics', Icon: Ionicons, icon: 'laptop-outline' },
  { category: 'Furniture', Icon: MaterialCommunityIcons, icon: 'bed-outline' },
  { category: 'Clothing', Icon: Ionicons, icon: 'shirt-outline' },
  { category: 'Appliances', Icon: MaterialCommunityIcons, icon: 'fridge-outline' },
  { category: 'Other', Icon: Ionicons, icon: 'cube-outline' },
];

export default function MainHomeScreen({ firstName, onLogout, userId }) {
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Header avatar mirrors the profile photo
  const me = useQuery(api.users.current);

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  // Transition type for the next screen change, per platform conventions:
  // 'tab' for bottom-nav peers (fade in place), 'push'/'pop' for drill-ins
  // (slide from right / left), 'modal' for compose flows (slide up from
  // bottom), 'none' for the initial mount.
  const navTransition = useRef('none');
  const go = (screen, transition = 'none') => {
    navTransition.current = transition;
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
  const handleToggleSave = (listingId) => {
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
  const handleCategoryFilterPress = (category) => {
    setFilters({
      ...filters,
      category: filters.category === category ? 'All' : category,
    });
  };
  
  // Filter function to apply filters to items
  const filterItems = (items) => {
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
  const handleItemPress = (item) => {
    // Opening details from details (similar items) keeps the original source
    if (currentScreen !== 'itemDetails') {
      setDetailsSource(currentScreen);
    }
    setSelectedItem(item);
    go('itemDetails', 'push');
  };

  // Back from details pops to wherever it was opened from
  const handleCloseDetails = () => {
    go(detailsSource, 'pop');
    setSelectedItem(null);
    setSelectedChat(null);
  };

  const handleChatWithSeller = (item) => {
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
    go('chat', 'push');
  };

  const handleChatPress = (chat) => {
    setSelectedChat(chat);
    go('chat', 'push');
  };

  // Dismiss an overlay back to the home tab (e.g. closing the compose flow);
  // chat opened from a listing also returns home.
  const homeAsTab = () => {
    go('home', 'tab');
    setSelectedItem(null);
    setSelectedChat(null);
  };

  const homeAsPop = () => {
    go('home', 'pop');
    setSelectedItem(null);
    setSelectedChat(null);
  };

  const handleBackToMessages = () => {
    go('messagesList', 'pop');
    setSelectedChat(null);
  };

  const handleSellPress = () => {
    go('createListing', 'modal');
  };

  const handleProfilePress = () => {
    go('profile');
  };

  const handleEditListing = (listing) => {
    setSelectedItem(listing);
    go('editListing', 'modal');
  };

  const handleBackToProfile = () => {
    // Dismissing the edit-listing modal: profile reappears in place
    go('profile', 'tab');
    setSelectedItem(null);
  };

  const handleListingCreated = () => {
    // Dismissing the sell modal — the reactive feed picks up the new listing
    homeAsTab();
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
      <ScreenTransition key="itemDetails" type={navTransition.current} style={styles.overlay}>
        <ItemDetailsScreen
          item={selectedItem}
          onBack={handleCloseDetails}
          onChatWithSeller={handleChatWithSeller}
          onItemPress={handleItemPress}
          onEditListing={handleEditListing}
        />
      </ScreenTransition>
    );
  } else if (currentScreen === 'chat') {
    overlay = (
      <ScreenTransition key="chat" type={navTransition.current} style={styles.overlay}>
        <ChatScreen
          chat={selectedChat}
          item={selectedItem}
          onBack={selectedItem ? homeAsPop : handleBackToMessages}
        />
      </ScreenTransition>
    );
  } else if (currentScreen === 'createListing') {
    overlay = (
      <ScreenTransition key="createListing" type={navTransition.current} style={styles.overlay}>
        <CreateListingScreen
          onBack={homeAsTab}
          onSuccess={handleListingCreated}
        />
      </ScreenTransition>
    );
  } else if (currentScreen === 'editListing' && selectedItem) {
    overlay = (
      <ScreenTransition key="editListing" type={navTransition.current} style={styles.overlay}>
        <CreateListingScreen
          listing={selectedItem}
          onBack={handleBackToProfile}
          onSuccess={handleBackToProfile}
        />
      </ScreenTransition>
    );
  }

  const renderHome = () => (
    <View style={styles.container}>
      {/* Purple header: greeting + avatar, then search with built-in filter */}
      <View style={styles.header}>
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
            {/* For You Section (doubles as search results) */}
        {filteredForYou.length > 0 && (
          <FadeInView style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{isSearching ? 'Results' : 'For You'}</Text>
            </View>
            <FlatList
              data={filteredForYou}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.horizontalCard}>
                  <ListingCard
                    listing={item}
                    onPress={() => handleItemPress(item)}
                    isSaved={savedSet.has(item._id)}
                    onToggleSave={
                      item.sellerId === userId
                        ? undefined
                        : () => handleToggleSave(item._id)
                    }
                  />
                </View>
              )}
              contentContainerStyle={styles.horizontalList}
            />
          </FadeInView>
        )}

        {/* Trending Section */}
        {!isSearching && filteredTrending.length > 0 && (
          <FadeInView style={styles.section} delay={80}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending</Text>
            </View>
            <FlatList
              data={filteredTrending}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.horizontalCard}>
                  <ListingCard
                    listing={item}
                    onPress={() => handleItemPress(item)}
                    isSaved={savedSet.has(item._id)}
                    onToggleSave={
                      item.sellerId === userId
                        ? undefined
                        : () => handleToggleSave(item._id)
                    }
                  />
                </View>
              )}
              contentContainerStyle={styles.horizontalList}
            />
          </FadeInView>
        )}

        {/* Recently Listed Section */}
        {!isSearching && filteredRecentlyListed.length > 0 && (
          <FadeInView style={styles.section} delay={160}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Listed</Text>
            </View>
            <FlatList
              data={filteredRecentlyListed}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.horizontalCard}>
                  <ListingCard
                    listing={item}
                    onPress={() => handleItemPress(item)}
                    isSaved={savedSet.has(item._id)}
                    onToggleSave={
                      item.sellerId === userId
                        ? undefined
                        : () => handleToggleSave(item._id)
                    }
                  />
                </View>
              )}
              contentContainerStyle={styles.horizontalList}
            />
          </FadeInView>
        )}

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

  // One bottom-nav item; the active tab gets the filled icon and brand colour.
  const renderNavItem = (key, label, activeIcon, inactiveIcon) => {
    const active = activeTab === key;
    return (
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => go(key)}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
      >
        <Ionicons name={active ? activeIcon : inactiveIcon} size={26} color={active ? '#502E82' : '#999999'} />
        <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.shell}>
      {/* Status bar matches the active tab's header colour */}
      <StatusBar barStyle={activeTab === 'home' || activeTab === 'messagesList' ? 'light-content' : 'dark-content'} />

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
          <MessagesListScreen embedded onBack={homeAsTab} onChatPress={handleChatPress} />
        </View>
        <View style={[styles.tabPage, activeTab !== 'profile' && styles.tabPageHidden]}>
          <ProfileScreen
            embedded
            onLogout={onLogout}
            onItemPress={handleItemPress}
            onEditListing={handleEditListing}
          />
        </View>
      </View>

      {/* Persistent bottom navigation — stays put across every tab */}
      <View style={styles.bottomNav}>
        {renderNavItem('home', 'Home', 'home', 'home-outline')}
        {renderNavItem('saved', 'Saved', 'heart', 'heart-outline')}
        <PressableScale style={styles.sellButton} scaleTo={0.88} onPress={handleSellPress}>
          <View style={styles.addButtonCircle}>
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </View>
        </PressableScale>
        {renderNavItem('messagesList', 'Messages', 'chatbubble-ellipses', 'chatbubble-ellipses-outline')}
        {renderNavItem('profile', 'Profile', 'person', 'person-outline')}
      </View>

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
    paddingTop: 64,
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
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0ECF7',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  navLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999999',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#502E82',
    fontFamily: 'Poppins_500Medium',
  },
  sellButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    marginTop: -30,
  },
  addButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B39BD5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
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
    fontWeight: '700',
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
