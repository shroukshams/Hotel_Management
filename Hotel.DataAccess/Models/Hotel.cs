using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Hotel.DataAccess.Models
{
    public class Hotel : BaseEntity<int>
    {
    
        public string Name { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string ContactNumber { get; set; }
        public int StarRaring { get; set; }
        public string Email { get; set; }
        public string LogoUrl { get; set;}
        public string Description { get; set; }

        
    }
}
