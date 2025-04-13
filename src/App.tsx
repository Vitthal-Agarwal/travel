import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Link } from 'react-scroll';
import Typewriter from 'typewriter-effect';
import { Sparkles, Star, MapPin, Phone, Globe, DollarSign, MessageSquare, PhoneCall } from 'lucide-react';
import Lines from './components/Lines.tsx';
import Ball from './components/Ball.tsx';

declare global {
  interface Window {
    Cesium: any;
  }
}

const CHATGPT_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface ChatMessage {
  text: string;
  isUser: boolean;
  type?: 'location' | 'hotels' | 'flights';
}

interface TourSpot {
  name: string;
  lat: number;
  lng: number;
  fixedAltitude?: number;
  revolveTime: number;
  isGlobal?: boolean;
  isVantage?: boolean;
  details: string;
}

interface Hotel {
  name: string;
  lat: number;
  lng: number;
  rating: number;
  price: string;
  description: string;
  amenities: string[];
  image: string;
  website: string;
  phone: string;
  address: string;
}

interface Flight {
  name: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}

interface Feature {
  title: string;
  description: string;
  icon: JSX.Element;
}

interface Step {
  title: string;
  description: string;
}

function App() {
  // Add typingComplete state
  const [typingComplete, setTypingComplete] = useState(false);
  
  // Communication mode state
  const [communicationMode, setCommunicationMode] = useState<'chat' | 'voice'>('chat');
  const [userMessageCount, setUserMessageCount] = useState(0);

  // Images animation
  const [showImage1, setShowImage1] = useState(false);
  const [showImage2, setShowImage2] = useState(false);
  const [showImage3, setShowImage3] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const photos = [
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1502791451862-7bd8c1df43a7?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80"
  ];

  // Chat related states
  const placeholders = [
    "Tell me about hidden gems in Paris...",
    "What's the best time to visit Bali?",
    "Plan a 3-day trip to Tokyo...",
    "Where can I find authentic street food in Bangkok?",
    "Suggest off-the-beaten-path destinations in Italy..."
  ];
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { text: "Welcome to Roameo! How can I help you plan your next adventure?", isUser: false }
  ]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Tour, hotels and flights states
  const [currentSpotInfo, setCurrentSpotInfo] = useState<TourSpot | null>(null);
  const [showSpotInfo, setShowSpotInfo] = useState(false);
  const [currentHotel, setCurrentHotel] = useState<Hotel | null>(null);
  const [showHotelInfo, setShowHotelInfo] = useState(false);
  const [tourPhase, setTourPhase] = useState<'location' | 'hotels' | 'flights'>('location');
  const [showFlightsUI, setShowFlightsUI] = useState(false);
  const flights: Flight[] = [
    {
      name: "MIA → LAX",
      fromLat: 25.7959,
      fromLng: -80.2870,
      toLat: 33.9416,
      toLng: -118.4085
    },
    {
      name: "MIA → JFK",
      fromLat: 25.7959,
      fromLng: -80.2870,
      toLat: 40.6413,
      toLng: -73.7781
    },
  ];

  // Hotels data
  const [hotels] = useState<Hotel[]>([
    {
      name: "Celestial Heights Resort",
      lat: 25.7814,
      lng: -80.1870,
      rating: 4.8,
      price: "$450",
      description: "Ultra-modern luxury hotel with panoramic ocean views and AI-powered room automation",
      amenities: ["Infinity Pool", "Smart Rooms", "Spa", "Rooftop Restaurant"],
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      website: "https://example.com",
      phone: "+1 (305) 555-0123",
      address: "100 Ocean Drive, Miami Beach, FL 33139"
    },
    {
      name: "Nova Marina Bay",
      lat: 25.790654,
      lng: -80.1300455,
      rating: 4.9,
      price: "$580",
      description: "Boutique smart hotel featuring cutting-edge technology and personalized experiences",
      amenities: ["Private Beach", "Virtual Concierge", "Wellness Center", "Gourmet Dining"],
      image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
      website: "https://example.com",
      phone: "+1 (305) 555-0124",
      address: "200 Collins Avenue, Miami Beach, FL 33139"
    },
    {
      name: "Digital Oasis Resort",
      lat: 25.761681,
      lng: -80.191788,
      rating: 4.7,
      price: "$420",
      description: "Tech-forward accommodation with immersive entertainment and smart amenities",
      amenities: ["AR Experiences", "Smart Workspace", "Infinity Pool", "24/7 Robot Service"],
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      website: "https://example.com",
      phone: "+1 (305) 555-0125",
      address: "300 Brickell Avenue, Miami, FL 33131"
    }
  ]);

  // Features and steps for How It Works
  const features: Feature[] = [
    { title: "AI-Powered Planning", description: "Get personalized travel recommendations using advanced AI technology", icon: <Sparkles className="w-8 h-8" /> },
    { title: "3D Visualization", description: "Explore destinations in stunning 3D with our interactive globe", icon: <Sparkles className="w-8 h-8" /> },
    { title: "Smart Itineraries", description: "Automatically generate optimized travel schedules based on your preferences", icon: <Sparkles className="w-8 h-8" /> },
    { title: "Local Insights", description: "Access insider tips and hidden gems from local experts", icon: <Sparkles className="w-8 h-8" /> },
    { title: "Real-time Updates", description: "Stay informed with live weather and travel conditions", icon: <Sparkles className="w-8 h-8" /> },
    { title: "Smart Budgeting", description: "Track and optimize your travel expenses effortlessly", icon: <Sparkles className="w-8 h-8" /> }
  ];
  const steps: Step[] = [
    { title: "Tell Us Your Dreams", description: "Share your travel preferences and desires with our AI" },
    { title: "Get Personalized Plans", description: "Receive custom itineraries and recommendations" },
    { title: "Explore in 3D", description: "Visualize your destinations on our interactive globe" },
    { title: "Book with Confidence", description: "Secure the best deals for your perfect trip" }
  ];
  const travelWords = [
    "differently", "smarter", "efficiently", "boldly",
    "sustainably", "adventurously", "authentically", "mindfully"
  ];

  // Scroll chat container to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Load ElevenLabs voice script in voice mode
  useEffect(() => {
    if (communicationMode === 'voice') {
      if (!document.getElementById('elevenlabs-script')) {
        const script = document.createElement('script');
        script.id = 'elevenlabs-script';
        script.src = "https://elevenlabs.io/convai-widget/index.js";
        script.async = true;
        script.type = "text/javascript";
        document.body.appendChild(script);
      }
    }
  }, [communicationMode]);
  
  // Animate photos
  useEffect(() => {
    const selectRandomPhotos = () => {
      const shuffled = [...photos].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    };

    const startNewAnimation = () => {
      setShowImage1(false);
      setShowImage2(false);
      setShowImage3(false);
      setTimeout(() => {
        setSelectedPhotos(selectRandomPhotos());
        setTimeout(() => setShowImage1(true), 500);
        setTimeout(() => setShowImage2(true), 1000);
        setTimeout(() => setShowImage3(true), 1500);
      }, 700);
    };

    setSelectedPhotos(selectRandomPhotos());
    setTimeout(() => setShowImage1(true), 500);
    setTimeout(() => setShowImage2(true), 1000);
    setTimeout(() => setShowImage3(true), 1500);

    const interval = setInterval(startNewAnimation, 7500);
    return () => clearInterval(interval);
  }, []);

  // Cycle through input placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Initialize the Cesium globe
  const globeInitializedRef = useRef(false);
  const viewerRef = useRef<any>(null);
  const tilesetRef = useRef<any>(null);
  useEffect(() => {
    if (!globeInitializedRef.current) {
      initializeGlobe();
      globeInitializedRef.current = true;
    }
  }, []);
  const initializeGlobe = () => {
    const googleApiKey = "AIzaSyAQzjLwcLekZ8XjNt4jK8wYPmXqOGNYRkU";
    const googleTilesUrl = `https://tile.googleapis.com/v1/3dtiles/root.json?key=${googleApiKey}`;

    const viewer = new window.Cesium.Viewer("cesiumContainer", {
      imageryProvider: false,
      baseLayerPicker: false,
      geocoder: false,
      globe: false,
      homeButton: false,
      navigationHelpButton: false,
      timeline: false,
      animation: false,
      creditContainer: document.createElement("div"),
    });

    const tileset = new window.Cesium.Cesium3DTileset({
      url: googleTilesUrl,
      showCreditsOnScreen: true,
      skipLevelOfDetail: true,
      baseScreenSpaceError: 1024,
      skipScreenSpaceErrorFactor: 16,
      skipLevels: 1,
      immediatelyLoadDesiredLevelOfDetail: false,
      loadSiblings: false
    });

    viewer.scene.primitives.add(tileset);
    viewerRef.current = viewer;
    tilesetRef.current = tileset;
  };

  // Tour, hotels and flights routines remain the same
  const startTour = () => {
    setTourPhase('location');
    const tourSpots: TourSpot[] = [
      {
        name: "Global Earth View",
        lat: 0,
        lng: 0,
        fixedAltitude: 80000000,
        revolveTime: 5,
        isGlobal: true,
        details: "The starting point from a global perspective."
      },
      {
        name: "Miami Vantage",
        lat: 25.761681,
        lng: -80.191788,
        fixedAltitude: 1000,
        revolveTime: 6,
        isVantage: true,
        details: "A breathtaking closer overview of Miami's skyline."
      },
      {
        name: "FTX Arena",
        lat: 25.7814,
        lng: -80.1870,
        fixedAltitude: 1000,
        revolveTime: 6,
        details: "Home to the Miami Heat and a vibrant downtown destination."
      },
      {
        name: "South Beach",
        lat: 25.790654,
        lng: -80.1300455,
        fixedAltitude: 1000,
        revolveTime: 6,
        details: "Famous for sandy beaches, lively nightlife, and iconic architecture."
      }
    ];
    let currentIndex = 1;
    const flyToSpot = (
      prevSpot: TourSpot | null,
      nextSpot: TourSpot,
      onComplete: () => void
    ) => {
      if (!viewerRef.current) return;
      const center = window.Cesium.Cartesian3.fromDegrees(nextSpot.lng, nextSpot.lat, 0);
      const boundingSphere = new window.Cesium.BoundingSphere(center, 1.0);

      setShowSpotInfo(false);
      setTimeout(() => {
        setCurrentSpotInfo(nextSpot);
        setShowSpotInfo(true);
      }, 1000);

      viewerRef.current.camera.flyToBoundingSphere(boundingSphere, {
        offset: new window.Cesium.HeadingPitchRange(
          0,
          -Math.PI / 4,
          nextSpot.fixedAltitude || 1000
        ),
        duration: 8.0,
        complete: () => {
          setTimeout(() => {
            setShowSpotInfo(false);
            onComplete();
          }, nextSpot.revolveTime * 1000);
        }
      });
    };
    const goNext = () => {
      if (currentIndex >= tourSpots.length) return;
      const prevSpot = tourSpots[currentIndex - 1];
      const nextSpot = tourSpots[currentIndex];
      flyToSpot(prevSpot, nextSpot, () => {
        currentIndex++;
        goNext();
      });
    };
    flyToSpot(null, tourSpots[1], () => {
      currentIndex = 2;
      goNext();
    });
  };

  const showHotels = () => {
    if (!viewerRef.current) return;
    viewerRef.current.entities.removeAll();
    hotels.forEach((hotel) => {
      viewerRef.current.entities.add({
        position: window.Cesium.Cartesian3.fromDegrees(hotel.lng, hotel.lat, 200),
        billboard: {
          image: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="#F7B500"/>
              <circle cx="20" cy="20" r="16" fill="black"/>
              <circle cx="20" cy="20" r="8" fill="#F7B500"/>
            </svg>
          `),
          verticalOrigin: window.Cesium.VerticalOrigin.CENTER,
          scale: 1,
          pixelOffset: new window.Cesium.Cartesian2(0, 0),
        },
        label: {
          text: hotel.name,
          font: '16px Poppins',
          style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: window.Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new window.Cesium.Cartesian2(0, -30),
          fillColor: window.Cesium.Color.fromCssColorString('#F7B500'),
          outlineColor: window.Cesium.Color.BLACK,
          showBackground: true,
          backgroundColor: window.Cesium.Color.fromCssColorString('#000000').withAlpha(0.7),
        }
      });
    });
    const center = window.Cesium.Cartesian3.fromDegrees(-80.1870, 25.7814, 0);
    const boundingSphere = new window.Cesium.BoundingSphere(center, 5000);
    viewerRef.current.camera.flyToBoundingSphere(boundingSphere, {
      offset: new window.Cesium.HeadingPitchRange(0, -Math.PI / 4, 800),
      duration: 3.0,
      complete: () => {
        tourHotels();
      }
    });
  };

  const tourHotels = () => {
    let index = 0;
    const viewDuration = 3000;
    const flyDuration = 4.0;
    const flyHotel = (hotel: Hotel, onComplete: () => void) => {
      const pos = window.Cesium.Cartesian3.fromDegrees(hotel.lng, hotel.lat, 0);
      const boundingSphere = new window.Cesium.BoundingSphere(pos, 50);
      setCurrentHotel(hotel);
      setShowHotelInfo(true);
      viewerRef.current.camera.flyToBoundingSphere(boundingSphere, {
        offset: new window.Cesium.HeadingPitchRange(0, -Math.PI / 4, 300),
        duration: flyDuration,
        complete: () => {
          setTimeout(() => {
            setShowHotelInfo(false);
            onComplete();
          }, viewDuration);
        }
      });
    };
    const nextHotel = () => {
      if (index >= hotels.length) return;
      flyHotel(hotels[index], () => {
        index++;
        nextHotel();
      });
    };
    nextHotel();
  };

  const showFlights = () => {
    setTourPhase('flights');
    setShowFlightsUI(true);
    if (!viewerRef.current) return;
    viewerRef.current.entities.removeAll();
    flights.forEach((flight) => {
      const fromPos = window.Cesium.Cartesian3.fromDegrees(flight.fromLng, flight.fromLat, 2000);
      const toPos = window.Cesium.Cartesian3.fromDegrees(flight.toLng, flight.toLat, 2000);
      viewerRef.current.entities.add({
        polyline: {
          positions: [fromPos, toPos],
          width: 5,
          material: new window.Cesium.PolylineOutlineMaterialProperty({
            color: window.Cesium.Color.CYAN.withAlpha(0.7),
            outlineColor: window.Cesium.Color.BLUE,
            outlineWidth: 2
          })
        },
      });
      const midpointLat = (flight.fromLat + flight.toLat) / 2;
      const midpointLng = (flight.fromLng + flight.toLng) / 2;
      viewerRef.current.entities.add({
        position: window.Cesium.Cartesian3.fromDegrees(midpointLng, midpointLat, 2700),
        label: {
          text: flight.name,
          font: '18px Poppins',
          fillColor: window.Cesium.Color.CYAN,
          outlineColor: window.Cesium.Color.BLACK,
          outlineWidth: 3,
          style: window.Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new window.Cesium.Cartesian2(0, -50)
        }
      });
    });
    const center = window.Cesium.Cartesian3.fromDegrees(-96.0, 37.0, 0);
    const boundingSphere = new window.Cesium.BoundingSphere(center, 4000000);
    viewerRef.current.camera.flyToBoundingSphere(boundingSphere, {
      offset: new window.Cesium.HeadingPitchRange(0, -Math.PI / 4, 6000000),
      duration: 3.0
    });
  };

  // Sends chat conversation to ChatGPT API.
  const sendMessageToChatGPT = async (conversation: ChatMessage[]) => {
    try {
      const lastMessage = conversation[conversation.length - 1];
      if (lastMessage.isUser) {
        setUserMessageCount(prev => prev + 1);
      }
      const messagesForAPI = conversation.map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text
      }));
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CHATGPT_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: messagesForAPI,
          temperature: 0.7
        })
      });
      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        const reply = data.choices[0].message.content;
        setChatMessages(prev => [...prev, { text: reply, isUser: false }]);
      }
    } catch (error) {
      console.error('Error communicating with ChatGPT:', error);
    }
  };

  useEffect(() => {
    if (userMessageCount === 1) {
      startTour();
    } else if (userMessageCount === 2) {
      showHotels();
      setChatMessages(prev => [
        ...prev,
        { text: "Here are some excellent hotels in the area! Click on any marker or watch the tour.", isUser: false, type: 'hotels' }
      ]);
    } else if (userMessageCount === 3) {
      showFlights();
      setChatMessages(prev => [
        ...prev,
        { text: "Check out these flights. You'll see clear and sleek flight paths above the earth.", isUser: false, type: 'flights' }
      ]);
    }
  }, [userMessageCount]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const newUserMessage = { text: chatInput, isUser: true };
      const updatedChat = [...chatMessages, newUserMessage];
      setChatMessages(updatedChat);
      setChatInput('');
      sendMessageToChatGPT(updatedChat);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(e as any);
    }
  };

  // Toggle communication mode (chat or voice)
  const handleCommunicationModeChange = (mode: 'chat' | 'voice') => {
    setCommunicationMode(mode);
  };

  return (
    <div className="relative">
      {/* HEADER/HERO */}
      <div className="min-h-screen bg-[#F7B500] relative overflow-hidden">
        <nav className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="https://i.imgur.com/30Izu7O.png" alt="Roameo Logo" className="w-12 h-12 brightness-0" />
            <span className="text-4xl font-bold font-playfair tracking-wide">Roameo</span>
          </div>
          <div className="flex items-center">
            <div className="flex gap-8">
              <Link to="about" smooth={true} duration={500} className="text-lg font-poppins font-semibold text-black hover:bg-black/10 px-6 py-2 rounded-full transition-all duration-300 cursor-pointer">About</Link>
              <Link to="features" smooth={true} duration={500} className="text-lg font-poppins font-semibold text-black hover:bg-black/10 px-6 py-2 rounded-full transition-all duration-300 cursor-pointer">Features</Link>
              <Link to="how-it-works" smooth={true} duration={500} className="text-lg font-poppins font-semibold text-black hover:bg-black/10 px-6 py-2 rounded-full transition-all duration-300 cursor-pointer">How It Works</Link>
            </div>
          </div>
        </nav>
        <main className="h-[calc(100vh-5rem)] flex items-center px-4">
          <div className="max-w-[1400px] mx-auto relative flex items-center justify-between">
            <div className="max-w-2xl pr-48">
              <h1 className="text-8xl font-bold font-playfair mb-6">
                Travel
                <br />
                <span className="inline-block">
                  <Typewriter options={{ strings: travelWords, autoStart: true, loop: true, delay: 50, deleteSpeed: 30, pauseFor: 2000 }} />
                </span>
              </h1>
              <div className="text-2xl h-[4rem] mb-8 font-poppins">
                {!typingComplete ? (
                  <Typewriter onInit={(typewriter) => {
                    typewriter.typeString('We bring the world to you so that you can go anywhere in the world.')
                      .callFunction(() => setTypingComplete(true))
                      .start();
                  }} options={{ delay: 50, cursor: '' }} />
                ) : (
                  <div>We bring the world to you so that you can go anywhere in the world.</div>
                )}
              </div>
              <div className="flex gap-4">
                <button className="z-20 bg-black text-white px-8 py-4 rounded-full font-bold font-poppins transition-all duration-300 hover:bg-white hover:text-black">
                  Start chatting
                </button>
              </div>
            </div>
            <div className="relative w-[700px] h-[700px]">
              {selectedPhotos.length >= 3 && (
                <>
                  <img src={selectedPhotos[0]} alt="Featured Destination" className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] rounded-lg shadow-xl transform rotate-2 z-20 transition-all duration-700 ${showImage1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} />
                  <img src={selectedPhotos[1]} alt="Travel Scene" className={`absolute top-20 -left-24 w-64 rounded-lg shadow-xl transform -rotate-6 z-10 transition-all duration-700 ${showImage2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} />
                  <img src={selectedPhotos[2]} alt="Travel Scene" className={`absolute bottom-32 -right-20 w-72 rounded-lg shadow-xl transform rotate-6 z-30 transition-all duration-700 ${showImage3 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} />
                </>
              )}
            </div>
          </div>
        </main>
        <Lines />
        <Ball />
      </div>

      {/* ABOUT SECTION */}
      <section id="about" className="min-h-screen bg-white py-24 px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-24">
          <div className="flex-[1.4] bg-white p-12 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-6xl font-bold font-playfair mb-12">About</h2>
            <div className="space-y-6 text-xl font-poppins text-gray-700">
              <p>Roameo is revolutionizing the way people plan and experience their travels. By combining cutting-edge AI technology with immersive 3D visualization, we're creating a platform that makes travel planning not just easier, but truly inspiring.</p>
              <p>Our mission is to transform the traditional travel planning process into an engaging, interactive experience. We understand that every traveler is unique, which is why our AI-powered system learns from your preferences to create perfectly tailored itineraries.</p>
              <p>With Roameo, you're not just planning a trip - you're crafting an adventure. Our platform provides real-time insights, local recommendations, and stunning 3D previews of your destinations, ensuring you make informed decisions about your journey.</p>
            </div>
          </div>
          <div className="flex-1 pl-12">
            <img src="https://mindtrip.ai/cdn-cgi/image/w=750,format=webp,h=620,fit=cover/https://images.mindtrip.ai/web/hp-new-folio.png" alt="Travel Planning Illustration" className="w-full h-auto rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="min-h-screen bg-gray-50 py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-6xl font-bold font-playfair mb-16 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-2 hover:border-[#F7B500] group min-h-[240px] flex flex-col">
                <div className="mb-4 text-[#F7B500] group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold font-playfair mb-4">{feature.title}</h3>
                <p className="text-gray-600 font-poppins">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="min-h-screen bg-white py-24 px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-24">
          <div className="flex-1">
            <img src="https://mindtrip.ai/cdn-cgi/image/w=750,format=webp,h=620,fit=cover/https://images.mindtrip.ai/web/hp-new-folio.png" alt="Travel Planning Illustration" className="w-full h-auto rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-6xl font-bold font-playfair mb-16">How It Works</h2>
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div key={index} className="relative flex items-center gap-6">
                  <div className="w-12 h-12 bg-[#F7B500] rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">{index + 1}</div>
                  <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-2 hover:border-[#F7B500] flex-1">
                    <h3 className="text-2xl font-bold font-playfair mb-2">{step.title}</h3>
                    <p className="text-gray-600 font-poppins">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="absolute left-6 bottom-0 top-full w-[2px] bg-[#F7B500] transform translate-y-4 z-0 h-12"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CHAT + 3D GLOBE SECTION */}
      <section id="chat-section" className="min-h-screen bg-black relative">
        {/* Fullscreen Globe Container */}
        <div id="cesiumContainer" className="w-full h-full"></div>
        
        {/* Communication Mode Toggle - fixed above the bottom panel */}
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-60 flex gap-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg">
          <button 
            onClick={() => handleCommunicationModeChange('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-poppins font-semibold transition-all duration-300 ${
              communicationMode === 'chat' 
                ? 'bg-[#F7B500] text-black' 
                : 'bg-[#161616] text-white/70 hover:text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Chat
          </button>
          <button 
            onClick={() => handleCommunicationModeChange('voice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-poppins font-semibold transition-all duration-300 ${
              communicationMode === 'voice' 
                ? 'bg-[#F7B500] text-black' 
                : 'bg-[#161616] text-white/70 hover:text-white'
            }`}
          >
            <PhoneCall className="w-5 h-5" />
            Voice
          </button>
        </div>
        
        {/* Chat Panel Overlay */}
        {communicationMode === 'chat' && (
          <div className="fixed bottom-0 left-0 w-full bg-[#080808] p-4 z-50">
            <div ref={chatContainerRef} className="max-h-[30vh] overflow-y-auto mb-4 px-4">
              <div className="space-y-2">
                {chatMessages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg p-4 ${
                      message.isUser 
                        ? 'bg-[#F7B500] text-black' 
                        : 'bg-[#161616] text-white'
                    }`}
                  >
                    <p className="font-poppins">{message.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <form onSubmit={handleChatSubmit} className="relative px-4">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholders[currentPlaceholderIndex]}
                className="w-full bg-[#161616] text-white rounded-lg px-4 py-3 pr-12 resize-none font-poppins focus:outline-none focus:ring-2 focus:ring-[#F7B500]"
                rows={3}
              />
              <button type="submit" className="absolute right-6 bottom-4 bg-[#F7B500] text-black p-2 rounded-lg hover:bg-[#F7B500]/80 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* Voice Interface Overlay */}
        {communicationMode === 'voice' && (
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 w-96 p-4">
            <elevenlabs-convai agent-id="DxB694ZM2dbBPjr7hYcY"></elevenlabs-convai>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
