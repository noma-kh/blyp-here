'use client';
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import CafeCard from "../components/CafeCard";
import JobCard from "../components/JobCard";
import { coffeeshopService } from '../services/coffeeshopService';
import { jobService } from '../services/jobService';
import { authService } from '../services/authService';

export default function CoffeeCommunityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Top Rated');
  const [coffeeshops, setCoffeeshops] = useState([]);
  const [jobPostings, setJobPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const tabs = ['Top Rated', 'For studying', 'For chilling', 'Work-friendly', 'Specialties', 'New'];

  // Load user data
  useEffect(() => {
    const userData = authService.getStoredUser();
    setUser(userData);
  }, []);

  // Load coffeeshops based on active tab
  useEffect(() => {
    loadCoffeeshops();
  }, [activeTab]);

  // Load job postings
  useEffect(() => {
    loadJobPostings();
  }, []);

  const loadCoffeeshops = async () => {
    try {
      setLoading(true);
      let params = { limit: 4 };

      // Map tabs to API parameters
      switch (activeTab) {
        case 'Top Rated':
          params.sortBy = 'rating';
          break;
        case 'For studying':
          params.vibes = 'study-friendly';
          break;
        case 'For chilling':
          params.vibes = 'cozy';
          break;
        case 'Work-friendly':
          params.vibes = 'workspace';
          break;
        case 'Specialties':
          params.specialties = 'specialty-coffee';
          break;
        case 'New':
          params.sortBy = 'newest';
          break;
        default:
          params.sortBy = 'rating';
      }

      const response = await coffeeshopService.getCoffeeshops(params);
      setCoffeeshops(response.data || []);
    } catch (error) {
      console.error('Error loading coffeeshops:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobPostings = async () => {
    try {
      const response = await jobService.getJobs({ limit: 2, sortBy: 'featured' });
      setJobPostings(response.data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await coffeeshopService.getCoffeeshops({
        search: searchQuery,
        limit: 12
      });
      setCoffeeshops(response.data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = async (coffeeshopId) => {
    if (!user) {
      alert('Please login to bookmark coffeeshops');
      return;
    }

    try {
      // Import bookmarkService
      const { bookmarkService } = await import('../services/bookmarkService');
      await bookmarkService.toggleBookmark(coffeeshopId, 'favorites');
      
      // Refresh coffeeshops to update bookmark status
      loadCoffeeshops();
    } catch (error) {
      console.error('Bookmark error:', error);
      alert('Error updating bookmark');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="text-black font-normal text-base">About</div>
              <div className="flex space-x-8">
                <a href="#" className="text-gray-600 hover:text-black">Home</a>
                <a href="#" className="text-gray-600 hover:text-black">Explore</a>
                <a href="#" className="text-gray-600 hover:text-black">Jobs</a>
                <a href="#" className="text-gray-600 hover:text-black">Journal</a>
                <a href="#" className="text-gray-600 hover:text-black">
                  {user ? user.name : 'Profile'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-start justify-between pt-12 pb-8">
          <div className="flex-1">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 mr-3">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path d="..." fill="#8B5A2B"/>
                </svg>
              </div>
              <h1 className="text-3xl font-mohave text-gray-900">What is coffee for YOU?</h1>
            </div>
            <p className="text-gray-600 mb-4 text-lg">For us, coffee is a community.</p>
            <a href="#" className="text-black underline hover:text-blue-800">
              Find out what others think
            </a>
          </div>
        </div>

        {/* Search */}
        <div className="text-center py-8">
          <p className="text-gray-700 mb-6 text-lg">
            Do not know which coffeeshop to go next? We got you!
          </p>
          <div className="max-w-sm mx-auto relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search coffeeshops..."
              className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <button
              onClick={handleSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
            >
              <Search className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center space-x-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`mx-3 text-sm font-light pb-1 transition-colors border-b-2 ${
                activeTab === tab ? 'text-black border-black' : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {/* Cafe Cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {coffeeshops.map((coffeeshop) => (
              <CafeCard
                key={coffeeshop._id}
                name={coffeeshop.name}
                city={`${coffeeshop.address.city}, Mongolia`}
                rating={coffeeshop.rating.average}
                reviews={coffeeshop.rating.count}
                tags={coffeeshop.vibes}
                image={coffeeshop.images?.[0]?.url || "/default-cafe.jpg"}
                logo={coffeeshop.logo?.url || "/default-logo.png"}
                bookmarked={coffeeshop.isBookmarked || false}
                onBookmarkToggle={() => handleBookmarkToggle(coffeeshop._id)}
                tagClassName="bg-white text-black font-light border border-black px-2 py-0.5 rounded-full text-xs"
              />
            ))}
          </div>
        )}

        <div className="text-center mb-12">
          <button className="text-gray-600 hover:text-gray-800 text-sm">
            View all coffeeshops
          </button>
        </div>

        {/* Job Postings */}
        <h2 className="text-xl font-semibold mb-4">Recent Job Postings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {jobPostings.map((job) => (
            <JobCard 
              key={job._id}
              title={job.title}
              company={job.company}
              locations={job.locations.map(loc => `${loc.district}, ${loc.city}`)}
              type={job.jobType}
              tags={job.tags}
              postedTime={new Date(job.createdAt).toLocaleDateString()}
              rating={job.coffeeshopInfo?.rating?.average}
              reviewCount={job.coffeeshopInfo?.rating?.count || 0}
              logo={job.logo?.text || job.company.charAt(0)}
              logoColor={job.logo?.backgroundColor || "bg-amber-700"}
            />
          ))}
        </div>
      </div>

      {/* Join CTA */}
      <div className="text-center py-12">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 mr-4">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              {/* Cat-like character with coffee */}
              <ellipse cx="32" cy="25" rx="18" ry="15" fill="none" stroke="black" strokeWidth="2"/>
              {/* Ears */}
              <path d="M18 15 L22 25 L26 15 Z" fill="none" stroke="black" strokeWidth="2"/>
              <path d="M38 15 L42 25 L46 15 Z" fill="none" stroke="black" strokeWidth="2"/>
              {/* Eyes */}
              <circle cx="26" cy="22" r="2" fill="black"/>
              <circle cx="38" cy="22" r="2" fill="black"/>
              {/* Coffee cup */}
              <rect x="42" y="20" width="12" height="16" rx="2" fill="none" stroke="black" strokeWidth="2"/>
              <path d="M54 26 Q58 26 58 30 Q58 34 54 34" fill="none" stroke="black" strokeWidth="2"/>
              {/* Steam */}
              <path d="M46 16 Q48 12 46 8" fill="none" stroke="black" strokeWidth="1"/>
              <path d="M50 16 Q52 12 50 8" fill="none" stroke="black" strokeWidth="1"/>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Want to join us?</h2>
        </div>
        <button className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium">
          Create profile
        </button>
      </div>

      {/* Black footer section */}
      <div className="bg-black h-96 w-full mt-16"></div>
    </div> 
  );
}